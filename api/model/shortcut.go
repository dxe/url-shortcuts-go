package model

import (
	"fmt"

	"github.com/jmoiron/sqlx"
)

type Shortcut struct {
	ID        int    `db:"id"`
	Code      string `db:"code"`
	URL       string `db:"url"`
	CreatedAt string `db:"created"`
	CreatedBy int    `db:"created_by"` // TODO: consider joining user table to get user name
	UpdatedAt string `db:"updated"`
	UpdatedBy string `db:"updated_by"`
}

func GetShortcutByCode(db *sqlx.DB, code string) (Shortcut, error) {
	query := `
		SELECT id, code, url, created, created_by, updated, updated_by
		FROM shortcuts
		WHERE code = ?
	`

	var shortcuts []Shortcut
	if err := db.Select(&shortcuts, query, code); err != nil {
		return Shortcut{}, fmt.Errorf("failed to select shortcut: %w", err)
	}
	if shortcuts == nil {
		return Shortcut{}, nil
	}

	return shortcuts[0], nil
}

func ListShortcuts(db *sqlx.DB) ([]Shortcut, error) {
	// TODO: figure out paging, join user info, etc.
	query := `
		SELECT id, code, url, created, created_by, updated, updated_by
		FROM shortcuts
	`

	var shortcuts []Shortcut
	if err := db.Select(&shortcuts, query); err != nil {
		return nil, fmt.Errorf("failed to select shortcuts: %w", err)
	}
	if shortcuts == nil {
		return nil, nil
	}

	return shortcuts, nil
}
