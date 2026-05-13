package auth

import (
	"context"
	"strings"
	"time"

	"thiagoxchange/backend/internal/config"
	"thiagoxchange/backend/internal/platform/mailer"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	cfg    config.Config
	repo   *Repository
	mailer mailer.Mailer
}

func NewService(cfg config.Config, repo *Repository, mailer mailer.Mailer) *Service {
	return &Service{cfg: cfg, repo: repo, mailer: mailer}
}

func (s *Service) Register(ctx context.Context, name, email, phone, password string) (User, string, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	if name == "" || email == "" || len(password) < 6 {
		return User{}, "", ErrInvalidRegistration
	}
	hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	role := RoleUser
	if s.cfg.AdminEmails[email] {
		role = RoleAdmin
	}
	user, err := s.repo.Create(ctx, User{
		Name:         name,
		Email:        email,
		Phone:        phone,
		PasswordHash: string(hash),
		Verified:     true,
		Role:         role,
		CreatedAt:    time.Now(),
	})
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return User{}, "", ErrEmailExists
		}
		return User{}, "", err
	}
	token, err := s.issueToken(user)
	if err != nil {
		return User{}, "", err
	}
	_ = s.mailer.Send(user.Email, "Welcome to Thiago Exchange", "Hello "+user.Name+",\n\nYour Thiago Exchange account is ready.")
	return user, token, nil
}

func (s *Service) Login(ctx context.Context, email, password string) (User, string, error) {
	user, err := s.repo.FindByEmail(ctx, email)
	if err != nil || bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)) != nil {
		return User{}, "", ErrInvalidLogin
	}
	if s.cfg.AdminEmails[user.Email] && user.Role != RoleAdmin {
		_ = s.repo.SetRole(ctx, user.ID, RoleAdmin)
		user.Role = RoleAdmin
	}
	token, err := s.issueToken(user)
	return user, token, err
}

func (s *Service) UpdateProfile(ctx context.Context, user User, name, phone string) (User, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return User{}, ErrInvalidRegistration
	}
	return s.repo.UpdateProfile(ctx, user.ID, name, phone)
}

func (s *Service) issueToken(user User) (string, error) {
	return jwt.NewWithClaims(jwt.SigningMethodHS256, Claims{
		UserID: user.ID.Hex(),
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(72 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}).SignedString([]byte(s.cfg.JWTSecret))
}
