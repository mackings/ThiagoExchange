package trades

import (
	"errors"
	"net/http"

	"thiagoxchange/backend/internal/features/auth"
	"thiagoxchange/backend/internal/platform/httpx"

	"github.com/gorilla/websocket"
)

type Handler struct {
	service   *Service
	hub       *Hub
	authRepo  *auth.Repository
	jwtSecret string
}

func NewHandler(service *Service, hub *Hub, authRepo *auth.Repository, jwtSecret string) Handler {
	return Handler{service: service, hub: hub, authRepo: authRepo, jwtSecret: jwtSecret}
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func (h Handler) Create(w http.ResponseWriter, r *http.Request) {
	var input struct {
		RateID        string  `json:"rateId"`
		AmountUSD     float64 `json:"amountUsd"`
		PaymentBank   string  `json:"paymentBank"`
		AccountName   string  `json:"accountName"`
		AccountNumber string  `json:"accountNumber"`
	}
	if !httpx.Decode(w, r, &input) {
		return
	}
	trade, err := h.service.Create(r.Context(), auth.CurrentUser(r), input.RateID, input.AmountUSD, input.PaymentBank, input.AccountName, input.AccountNumber)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, ErrInvalidRate) || errors.Is(err, ErrAmountTooLow) {
			status = http.StatusBadRequest
		}
		if errors.Is(err, ErrRateNotFound) {
			status = http.StatusNotFound
		}
		httpx.Error(w, status, err.Error())
		return
	}
	httpx.JSON(w, http.StatusCreated, trade)
}

func (h Handler) List(w http.ResponseWriter, r *http.Request) {
	trades, err := h.service.List(r.Context(), auth.CurrentUser(r), r.URL.Query().Get("all") == "1")
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not load trades")
		return
	}
	httpx.JSON(w, http.StatusOK, trades)
}

func (h Handler) Get(w http.ResponseWriter, r *http.Request) {
	trade, err := h.service.Get(r.Context(), auth.CurrentUser(r), r.PathValue("id"))
	if err != nil {
		writeTradeError(w, err)
		return
	}
	h.broadcastTrade(trade)
	httpx.JSON(w, http.StatusOK, trade)
}

func (h Handler) AddHash(w http.ResponseWriter, r *http.Request) {
	var input struct {
		TransactionHash string `json:"transactionHash"`
	}
	if !httpx.Decode(w, r, &input) {
		return
	}
	trade, err := h.service.AddHash(r.Context(), auth.CurrentUser(r), r.PathValue("id"), input.TransactionHash)
	if err != nil {
		writeTradeError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, trade)
}

func (h Handler) AddMessage(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Body          string `json:"body"`
		AttachmentURL string `json:"attachmentUrl"`
	}
	if !httpx.Decode(w, r, &input) {
		return
	}
	trade, err := h.service.AddMessage(r.Context(), auth.CurrentUser(r), r.PathValue("id"), input.Body, input.AttachmentURL)
	if err != nil {
		writeTradeError(w, err)
		return
	}
	h.broadcastTrade(trade)
	httpx.JSON(w, http.StatusOK, trade)
}

func (h Handler) Cancel(w http.ResponseWriter, r *http.Request) {
	trade, err := h.service.Cancel(r.Context(), auth.CurrentUser(r), r.PathValue("id"))
	if err != nil {
		writeTradeError(w, err)
		return
	}
	h.broadcastTrade(trade)
	httpx.JSON(w, http.StatusOK, trade)
}

func (h Handler) AdminList(w http.ResponseWriter, r *http.Request) {
	trades, err := h.service.List(r.Context(), auth.CurrentUser(r), true)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not load trades")
		return
	}
	httpx.JSON(w, http.StatusOK, trades)
}

func (h Handler) SetStatus(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Status      string `json:"status"`
		ReceiptNote string `json:"receiptNote"`
	}
	if !httpx.Decode(w, r, &input) {
		return
	}
	trade, err := h.service.SetStatus(r.Context(), r.PathValue("id"), input.Status, input.ReceiptNote)
	if err != nil {
		writeTradeError(w, err)
		return
	}
	h.broadcastTrade(trade)
	httpx.JSON(w, http.StatusOK, trade)
}

func (h Handler) WebSocket(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		httpx.Error(w, http.StatusUnauthorized, "missing token")
		return
	}
	user, err := auth.UserFromToken(r.Context(), h.jwtSecret, h.authRepo, token)
	if err != nil {
		httpx.Error(w, http.StatusUnauthorized, "invalid token")
		return
	}
	trade, err := h.service.Get(r.Context(), user, r.PathValue("id"))
	if err != nil {
		writeTradeError(w, err)
		return
	}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	client := h.hub.Add(trade.ID.Hex(), conn)
	defer h.hub.Remove(client)

	_ = conn.WriteJSON(map[string]interface{}{"type": "trade", "trade": trade})
	for {
		var input struct {
			Type          string `json:"type"`
			Body          string `json:"body"`
			AttachmentURL string `json:"attachmentUrl"`
		}
		if err := conn.ReadJSON(&input); err != nil {
			return
		}
		if input.Type != "message" {
			continue
		}
		updated, err := h.service.AddMessage(r.Context(), user, trade.ID.Hex(), input.Body, input.AttachmentURL)
		if err != nil {
			_ = conn.WriteJSON(map[string]interface{}{"type": "error", "error": err.Error()})
			continue
		}
		h.broadcastTrade(updated)
	}
}

func (h Handler) broadcastTrade(trade Trade) {
	if h.hub == nil {
		return
	}
	h.hub.Broadcast(trade.ID.Hex(), map[string]interface{}{"type": "trade", "trade": trade})
}

func writeTradeError(w http.ResponseWriter, err error) {
	status := http.StatusInternalServerError
	if errors.Is(err, ErrForbidden) {
		status = http.StatusForbidden
	}
	if errors.Is(err, ErrTradeNotFound) {
		status = http.StatusNotFound
	}
	if errors.Is(err, ErrInvalidHash) || errors.Is(err, ErrInvalidMessage) || errors.Is(err, ErrInvalidStatus) || errors.Is(err, ErrTradeNotPending) {
		status = http.StatusBadRequest
	}
	httpx.Error(w, status, err.Error())
}
