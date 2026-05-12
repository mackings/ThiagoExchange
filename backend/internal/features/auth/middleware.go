package auth

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"thiagoxchange/backend/internal/platform/httpx"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type userKey struct{}

func WithUser(ctx context.Context, user User) context.Context {
	return context.WithValue(ctx, userKey{}, user)
}

func CurrentUser(r *http.Request) User {
	user, _ := r.Context().Value(userKey{}).(User)
	return user
}

func Middleware(secret string, users *Repository, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tokenString := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
		if tokenString == "" {
			httpx.Error(w, http.StatusUnauthorized, "missing token")
			return
		}
		user, err := UserFromToken(r.Context(), secret, users, tokenString)
		if err != nil {
			httpx.Error(w, http.StatusUnauthorized, "invalid token")
			return
		}
		next(w, r.WithContext(WithUser(r.Context(), user)))
	}
}

func Admin(secret string, users *Repository, next http.HandlerFunc) http.HandlerFunc {
	return Middleware(secret, users, func(w http.ResponseWriter, r *http.Request) {
		if CurrentUser(r).Role != RoleAdmin {
			httpx.Error(w, http.StatusForbidden, "admin access required")
			return
		}
		next(w, r)
	})
}

func UserFromToken(ctx context.Context, secret string, users *Repository, tokenString string) (User, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		if err == nil {
			err = errors.New("invalid token")
		}
		return User{}, err
	}
	claims, _ := token.Claims.(*Claims)
	id, err := primitive.ObjectIDFromHex(claims.UserID)
	if err != nil {
		return User{}, err
	}
	return users.FindByID(ctx, id)
}
