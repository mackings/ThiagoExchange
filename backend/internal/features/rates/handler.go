package rates

import (
	"net/http"

	"thiagoxchange/backend/internal/platform/httpx"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) Handler {
	return Handler{repo: repo}
}

func (h Handler) List(w http.ResponseWriter, r *http.Request) {
	rates, err := h.repo.Active(r.Context())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not load rates")
		return
	}
	httpx.JSON(w, http.StatusOK, rates)
}

func (h Handler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := primitive.ObjectIDFromHex(r.PathValue("id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid rate id")
		return
	}
	var input Rate
	if !httpx.Decode(w, r, &input) {
		return
	}
	if err := h.repo.Update(r.Context(), id, input); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not update rate")
		return
	}
	h.List(w, r)
}
