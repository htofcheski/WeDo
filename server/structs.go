package main

import (
	"net/http"
	"sync"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/qustavo/dotsql"
	_uuid "github.com/satori/go.uuid"
)

//////////////////// Database-> ////////////////////

type config struct {
	*sync.RWMutex `yaml:"-"`

	Database *DatabaseOptions `yaml:",omitempty"`
}

type DatabaseOptions struct {
	Driver                 string
	Host                   string
	Database               string
	Username               string
	Password               string
	GoogleProxyCredentials string        `yaml:"google_proxy_credentials,omitempty"`
	TLS                    string        `yaml:"tls,omitempty"`
	TLSCerts               string        `yaml:"tls_certs,omitempty"`
	TLSCA                  string        `yaml:"tls_ca,omitempty"`
	TLSClient              string        `yaml:"tls_client,omitempty"`
	TLSKey                 string        `yaml:"tls_key,omitempty"`
	MaxOpenConnections     int           `yaml:"max_open_connections"`
	MaxIdleConnections     int           `yaml:"max_idle_connections"`
	MaxLifetimeConnection  time.Duration `yaml:"max_lifetime_connection"`
	MaxIdleTimeConnection  time.Duration `yaml:"max_idle_time_connection"`

	DSN map[string]interface{}
}

type Database struct {
	sync.RWMutex

	Debug   bool
	Version string
	SSL     string

	postgre *sqlx.DB

	Queries       *dotsql.DotSql
	QueriesRawMap map[string]string
}

//////////////////// <-Database ////////////////////

//////////////////// Request-> ////////////////////

type Request struct {
	*http.Request
}

//////////////////// <-Request ////////////////////

type State struct {
	Icon       string
	Production bool
	Data       map[string]interface{}
}

type Organization struct {
	Index        uint64     `db:"index" json:"-"`
	Uuid         _uuid.UUID `db:"uuid" json:"uuid"`
	Name         string     `db:"name" json:"name"`
	Created      time.Time  `db:"created" json:"created"`
	Updated      time.Time  `db:"updated" json:"updated"`
	DeletedState int        `db:"deleted_state" json:"-"`
}

func (org *Organization) IsValid() bool {
	if len(org.Name) >= 3 && org.Index > 0 && org.Uuid != _uuid.Nil && org.DeletedState == 0 {
		return true
	}

	return false
}

type LoginState struct {
	LoggedIn bool
	Message  string
}

type OrgUser struct {
	Index          uint64     `db:"index" json:"-"`
	Uuid           _uuid.UUID `db:"uuid" json:"uuid"`
	OrgIndex       uint64     `db:"org_index" json:"-"`
	Username       string     `db:"username" json:"username"`
	Password       string     `db:"password" json:"-"`
	Email          string     `db:"email" json:"email"`
	Description    string     `db:"description" json:"description"`
	ProfilePicture string     `db:"profile_picture" json:"profile_picture"`
	Created        time.Time  `db:"created" json:"created"`
	Updated        time.Time  `db:"updated" json:"updated"`
	DeletedState   int        `db:"deleted_state" json:"-"`
}

func (user *OrgUser) IsValid() bool {
	if len(user.Username) >= 3 && user.Index > 0 && user.Uuid != _uuid.Nil && user.DeletedState == 0 {
		return true
	}

	return false
}

type Team struct {
	Index        uint64     `db:"index" json:"-"`
	Uuid         _uuid.UUID `db:"uuid" json:"uuid"`
	Name         string     `db:"name" json:"name"`
	Created      time.Time  `db:"created" json:"created"`
	Updated      time.Time  `db:"updated" json:"updated"`
	DeletedState int        `db:"deleted_state" json:"-"`
}

type TeamList []*Team

func (t *Team) IsValid() bool {
	if len(t.Name) >= 3 && t.Index > 0 && t.Uuid != _uuid.Nil && t.DeletedState == 0 {
		return true
	}

	return false
}

type TeamUser struct {
	Index        uint64     `db:"index" json:"-"`
	Uuid         _uuid.UUID `db:"uuid" json:"uuid"`
	TeamIndex    uint64     `db:"team_index" json:"-"`
	UserIndex    uint64     `db:"user_index" json:"-"`
	Created      time.Time  `db:"created" json:"created"`
	Updated      time.Time  `db:"updated" json:"updated"`
	DeletedState int        `db:"deleted_state" json:"-"`
}

type TeamUserList []*TeamUser

func (tul TeamUserList) TeamIndexes() []uint64 {
	indexes := []uint64{}
	for _, tu := range tul {
		indexes = append(indexes, tu.TeamIndex)
	}

	return indexes
}

// type TeamUserState struct {
// 	Organization Organization `json:"organization"`

// }
