package model

import (
	"fmt"

	"github.com/jmoiron/sqlx"
)

type Visit struct {
	ID         int    `db:"id"`
	Timestamp  string `db:"timestamp"`
	ShortcutID int    `db:"shortcut_id"`
	IPAddress  string `db:"ip_address"`
	Path       string `db:"path"`
	Referer    string `db:"referer"`
	UTMSource  string `db:"utm_source"`
	UserAgent  string `db:"user_agent"`
}

func InsertVisit(db *sqlx.DB, visit Visit) error {
	query := `
		INSERT INTO visits (shortcut_id, ip_address, path, referer, utm_source, user_agent)
		VALUES (:shortcut_id, :ip_address, :path, :referer, :utm_source, :user_agent) 
	`

	_, err := sqlx.NamedExec(db, query, visit)
	if err != nil {
		return fmt.Errorf("error inserting visit: %w", err)
	}

	return nil
}
