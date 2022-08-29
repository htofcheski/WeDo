package main

import (
	"database/sql"
	"fmt"
	"net"
	"strings"
	"sync"
	"time"

	color "github.com/fatih/color"
	_ "github.com/lib/pq"
)

const DriverName = "postgres"

type Database struct {
	sync.RWMutex

	Debug   bool
	Version string
	SSL     string

	postgre *sql.DB
}

func Version(db *sql.DB) string {
	return Variable(db, "server_version")
}

func Encoding(db *sql.DB) string {
	return Variable(db, "server_encoding")
}

func SSL(db *sql.DB) string {
	return Variable(db, "ssl")
}

func Variable(db *sql.DB, variableName string) string {
	if len(variableName) == 0 {
		return ""
	}
	value := ""
	if err := db.QueryRow(fmt.Sprintf("SHOW %q;", variableName)).Scan(&value); err != nil {
		Log.Errorf("postgre.Variable(%q): %s", variableName, err)
	}
	return value
}

func FormatDurationInSecondsSince(started time.Time) string {
	return fmt.Sprintf("%f seconds.", (time.Now().Sub(started)).Seconds())
}

func (do *DatabaseOptions) ConnectionStringDriver(no_password bool) string {
	host := do.Host
	host += ":5432"

	password := "****"
	if !no_password {
		password = do.Password
	}

	parts := []string{
		fmt.Sprintf("user=%s", do.Username),
		fmt.Sprintf("password=%s", password),
		fmt.Sprintf("dbname=%s", do.Database),
	}

	h, p, _ := net.SplitHostPort(host)
	parts = append(parts,
		fmt.Sprintf("host=%s", h),
		fmt.Sprintf("port=%s", p),
	)

	return strings.Join(parts, " ")
}

func Open(options *DatabaseOptions) (*sql.DB, error) {
	if options == nil {
		return nil, fmt.Errorf("%s: sql options is nil", DriverName)
	}

	// must
	for prop, value := range map[string]string{
		"Host":     options.Host,
		"Database": options.Database,
		"Username": options.Username,
		"Password": options.Password,
	} {
		if len(value) == 0 {
			return nil, fmt.Errorf("%s: options.%s is empty", DriverName, prop)
		}
	}

	var (
		db  *sql.DB
		err error
	)
	db, err = sql.Open(options.Driver, options.ConnectionStringDriver(false))
	if err != nil {
		return nil, fmt.Errorf("%s: %s open failed: %s", options.Driver, options.ConnectionStringDriver(true), err)
	}

	// apply post options
	if options.MaxOpenConnections > 0 {
		db.SetMaxOpenConns(options.MaxOpenConnections)
	}
	if options.MaxIdleConnections > 0 {
		db.SetMaxIdleConns(options.MaxIdleConnections)
	}
	if options.MaxLifetimeConnection > 0 {
		db.SetConnMaxLifetime(options.MaxLifetimeConnection)
	}
	if options.MaxIdleTimeConnection > 0 {
		db.SetConnMaxIdleTime(options.MaxIdleTimeConnection)
	}

	// ping check
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("%s: Failed to ping database server %s: %s", options.Driver, options.Host, err.Error())
	}

	return db, nil
}

func (db *Database) Initialize(options *DatabaseOptions) (err error) {
	db.Lock()
	defer db.Unlock()

	connStarted := time.Now()
	if db.postgre, err = Open(options); err != nil {
		return fmt.Errorf("DB connect error: %s", err.Error())
	}
	db.Version = Version(db.postgre)
	db.SSL = SSL(db.postgre)
	Log.Infof("Connected in %s - PostgreSQL v%s %s", FormatDurationInSecondsSince(connStarted), db.Version, db.SSL)

	return nil
}

func (db *Database) Close() error {
	if db.postgre == nil {
		return nil
	}
	return db.postgre.Close()
}

// Returns false on error
func (db *Database) CheckOperation(op string, err error, started time.Time) bool {
	spent := ""
	if !started.IsZero() {
		spent = FormatDurationInSecondsSince(started)
	}

	hasError := err != nil
	if hasError && !DatabaseNoResults(err) {
		// log error
		Log.Errorf(color.HiRedString("DB")+".%s error: %s (%s)", op, err.Error(), spent)
	}
	return hasError == false
}

// Rolls back transaction.
func (db *Database) Rollback(tx *sql.Tx) {
	if tx == nil {
		return
	}
	err := tx.Rollback()
	// already committed or rolled back
	if err == sql.ErrTxDone {
		err = nil
	}
	db.CheckOperation("Transaction.Rollback", err, time.Time{})
}

func DatabaseNoResults(err error) bool {
	return err == sql.ErrNoRows
}
