package giftcards

import (
	"errors"
	"net/http"

	"thiagoxchange/backend/internal/features/auth"
	"thiagoxchange/backend/internal/platform/httpx"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) Handler {
	return Handler{service: service}
}

func (h Handler) Config(w http.ResponseWriter, r *http.Request) {
	cfg, err := h.service.Config(r.Context())
	if err != nil {
		httpx.Error(w, http.StatusBadGateway, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, cfg)
}

func (h Handler) Submit(w http.ResponseWriter, r *http.Request) {
	var input SubmitInput
	if !httpx.Decode(w, r, &input) {
		return
	}
	order, err := h.service.Submit(r.Context(), auth.CurrentUser(r), input)
	if err != nil {
		writeError(w, err)
		return
	}
	httpx.JSON(w, http.StatusCreated, order)
}

func (h Handler) List(w http.ResponseWriter, r *http.Request) {
	orders, err := h.service.List(r.Context(), auth.CurrentUser(r), r.URL.Query().Get("all") == "1")
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not load gift card orders")
		return
	}
	httpx.JSON(w, http.StatusOK, orders)
}

func (h Handler) Get(w http.ResponseWriter, r *http.Request) {
	order, err := h.service.Get(r.Context(), auth.CurrentUser(r), r.PathValue("id"))
	if err != nil {
		writeError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, order)
}

func (h Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	order, err := h.service.Refresh(r.Context(), auth.CurrentUser(r), r.PathValue("id"))
	if err != nil {
		writeError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, order)
}

func (h Handler) AdminList(w http.ResponseWriter, r *http.Request) {
	orders, err := h.service.List(r.Context(), auth.CurrentUser(r), true)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not load gift card orders")
		return
	}
	httpx.JSON(w, http.StatusOK, orders)
}

func writeError(w http.ResponseWriter, err error) {
	status := http.StatusInternalServerError
	if errors.Is(err, ErrInvalidGiftCard) || errors.Is(err, ErrInvalidAmount) || errors.Is(err, ErrInvalidPayout) {
		status = http.StatusBadRequest
	}
	if errors.Is(err, ErrOrderNotFound) {
		status = http.StatusNotFound
	}
	if errors.Is(err, ErrForbidden) {
		status = http.StatusForbidden
	}
	if errors.Is(err, ErrPrestmitNotConfigured) {
		status = http.StatusServiceUnavailable
	}
	httpx.Error(w, status, err.Error())
}
