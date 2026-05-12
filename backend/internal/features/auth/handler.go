package auth

import (
	"errors"
	"net/http"

	"thiagoxchange/backend/internal/platform/httpx"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) Handler {
	return Handler{service: service}
}

func (h Handler) Register(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Phone    string `json:"phone"`
		Password string `json:"password"`
	}
	if !httpx.Decode(w, r, &input) {
		return
	}
	user, token, err := h.service.Register(r.Context(), input.Name, input.Email, input.Phone, input.Password)
	if err != nil {
		if errors.Is(err, ErrEmailExists) {
			httpx.Error(w, http.StatusConflict, err.Error())
			return
		}
		if errors.Is(err, ErrInvalidRegistration) {
			httpx.Error(w, http.StatusBadRequest, err.Error())
			return
		}
		httpx.Error(w, http.StatusInternalServerError, "could not create account")
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]interface{}{"token": token, "user": user})
}

func (h Handler) Login(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !httpx.Decode(w, r, &input) {
		return
	}
	user, token, err := h.service.Login(r.Context(), input.Email, input.Password)
	if err != nil {
		httpx.Error(w, http.StatusUnauthorized, ErrInvalidLogin.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]interface{}{"token": token, "user": user})
}

func (h Handler) Me(w http.ResponseWriter, r *http.Request) {
	httpx.JSON(w, http.StatusOK, map[string]interface{}{"user": CurrentUser(r)})
}
