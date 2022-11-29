package main

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"net/http"
	"time"

	"github.com/alexedwards/scs/v2"
	_uuid "github.com/satori/go.uuid"
)

var (
	sessionManager = &scs.SessionManager{}
)

func initSessionManager() {
	sessionManager = scs.New()
	sessionManager.Lifetime = 24 * time.Hour
	sessionManager.IdleTimeout = 20 * time.Minute
	sessionManager.Cookie.Name = "session_id"
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
	sessionManager.Put(ctx, token, user_uuid.String())

	return token, nil
}

func GetCurrentSession(r *http.Request) (_uuid.UUID, error) {
	token := r.Header.Get("Token")
	if len(token) == 0 {
		return _uuid.Nil, errors.New("No token header")
	}

	user_uuid_str := sessionManager.GetString(r.Context(), token)
	if len(user_uuid_str) == 0 {
		return _uuid.Nil, errors.New("Session not found")
	}

	return _uuid.FromStringOrNil(user_uuid_str), nil
}
