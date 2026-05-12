package auth

import "errors"

var (
	ErrInvalidRegistration = errors.New("name, email, and a password of at least 6 characters are required")
	ErrEmailExists         = errors.New("email already exists")
	ErrInvalidLogin        = errors.New("invalid email or password")
)
