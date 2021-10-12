package model

import (
	"fmt"
	"net/url"

	"github.com/jmoiron/sqlx"
)

type Shortcut struct {
	ID        int    `db:"id"`
	Code      string `db:"code"`
	URL       string `db:"url"`
	CreatedAt string `db:"created_timestamp"`
	CreatedBy int    `db:"created_by"` // TODO: consider joining user table to get user name
	UpdatedAt string `db:"updated"`
	UpdatedBy string `db:"updated_by"`
}

func GetRedirectURL(db *sqlx.DB, code string) (*url.URL, error) {
	query := `
		SELECT url
		FROM shortcuts
		WHERE code = ?
	`

	var shortcuts []Shortcut
	if err := db.Select(&shortcuts, query, code); err != nil {
		return nil, fmt.Errorf("failed to select shortcut: %w", err)
	}
	if shortcuts == nil {
		return nil, nil
	}

	path, err := url.Parse(shortcuts[0].URL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse url: %w", err)
	}

	return path, nil
}
