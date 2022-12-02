package main

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/alexedwards/scs/v2"
	_uuid "github.com/satori/go.uuid"
	"golang.org/x/crypto/bcrypt"
)

var (
	sessionManager *scs.SessionManager
)

func initSessionManager() {
	sessionManager = scs.New()
	sessionManager.Lifetime = 24 * time.Hour
	sessionManager.IdleTimeout = 20 * time.Minute
	sessionManager.Cookie.HttpOnly = true
}

func GenerateToken(n int) (string, error) {
	b := make([]byte, n)
	_, err := rand.Read(b)

	return base64.URLEncoding.EncodeToString(b), err
}

func CreateNewSession(ctx context.Context, user_uuid _uuid.UUID) (string, error) {
	token, err := GenerateToken(36)
	if err != nil {
		return "", err
	}

	fmt.Println(token, "OVA SE KREEIRA")

	sessionManager.Put(ctx, token, user_uuid.String())

	return token, nil
}

func GetCurrentSession(r *http.Request) (_uuid.UUID, error) {
	token, err := r.Cookie("test")
	if err != nil {
		return _uuid.Nil, errors.New("No token header")
	}
	fmt.Println(token.Value, "THIS!")
	if len(token.Value) == 0 {
		return _uuid.Nil, errors.New("No token header")
	}

	user_uuid_str := sessionManager.GetString(r.Context(), token.Value)
	if len(user_uuid_str) == 0 {
		return _uuid.Nil, errors.New("Session not found")
	}

	return _uuid.FromStringOrNil(user_uuid_str), nil
}

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
