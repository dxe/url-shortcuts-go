package model

import (
	"fmt"

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

func GetRedirectURL(db *sqlx.DB, code string) (string, error) {
	query := `
		SELECT url
		FROM shortcuts
		WHERE code = ?
	`

	var shortcuts []Shortcut
	if err := db.Select(&shortcuts, query); err != nil {
		return "", fmt.Errorf("failed to select shortcut: %w", err)
	}
	if shortcuts == nil {
		return "", nil
	}
	return shortcuts[0].URL, nil
}
