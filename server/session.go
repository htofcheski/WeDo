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

func GenerateSessionToken(n int) (string, error) {
	b := make([]byte, n)
	_, err := rand.Read(b)

	return base64.URLEncoding.EncodeToString(b), err
}

func CreateNewSession(ctx context.Context, user_uuid _uuid.UUID) (string, error) {
	session_token, err := GenerateSessionToken(36)
	if err != nil {
		return "", err
	}

	sessionManager.Put(ctx, session_token, user_uuid.String())

	return session_token, nil
}

func GetCurrentSession(r *http.Request) (_uuid.UUID, error) {
	session_token_cookie, err := r.Cookie("session_token")
	if err != nil {
		return _uuid.Nil, err
	}

	if len(session_token_cookie.Value) == 0 {
		return _uuid.Nil, errors.New("no session token header")
	}

	user_uuid_str := sessionManager.GetString(r.Context(), session_token_cookie.Value)
	if len(user_uuid_str) == 0 {
		return _uuid.Nil, errors.New("session not found")
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

func apiUserState(r *http.Request) (*OrgUser, *Organization, TeamList, TeamUserList, error) {
	user_uuid, err := GetCurrentSession(r)
	if err != nil {
		return &OrgUser{}, &Organization{}, TeamList{}, TeamUserList{}, err
	}

	org_user, err := orgUserByUUID(user_uuid)
	if err != nil {
		return &OrgUser{}, &Organization{}, TeamList{}, TeamUserList{}, err
	}

	org, err := organizationForOrgUser(org_user)
	if err != nil {
		return &OrgUser{}, &Organization{}, TeamList{}, TeamUserList{}, err
	}

	teams, teams_user, err := teamsForOrgUser(org_user)
	if err != nil {
		return &OrgUser{}, &Organization{}, TeamList{}, TeamUserList{}, err
	}

	return org_user, org, teams, teams_user, nil
}
