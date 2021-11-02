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
	UpdatedBy int    `db:"updated_by"`
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

func InsertShortcut(db *sqlx.DB, shortcut Shortcut) (int64, error) {
	query := `
		INSERT INTO shortcuts (code, url, created_by, updated_by)
		VALUES (:code, :url, :created_by, :updated_by) 
	`

	res, err := sqlx.NamedExec(db, query, shortcut)
	if err != nil {
		return 0, fmt.Errorf("error inserting shortcut: %w", err)
	}

	id, err := res.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("error getting id of inserted shortcut: %w", err)
	}

	return id, nil
}

func UpdateShortcut(db *sqlx.DB, shortcut Shortcut) error {
	query := `
		UPDATE shortcuts
		SET code = :code,
		    url = :url,
		    updated = CURRENT_TIMESTAMP,
		    updated_by = :updated_by
		WHERE id = :id
	`

	_, err := sqlx.NamedExec(db, query, shortcut)
	if err != nil {
		return fmt.Errorf("error updating shortcut: %w", err)
	}

	return nil
}

func DeleteShortcut(db *sqlx.DB, shortcut Shortcut) error {
	query := `
		DELETE FROM shortcuts
		WHERE id = :id
	`

	_, err := sqlx.NamedExec(db, query, shortcut)
	if err != nil {
		return fmt.Errorf("error deleting shortcut: %w", err)
	}

	return nil
}
