package model

import (
	"fmt"

	"github.com/jmoiron/sqlx"
)

type User struct {
	ID           int    `db:"id"`
	Name         string `db:"name"`
	Email        string `db:"email"`
	CreatedAt    string `db:"created"`
	LastLoggedIn string `db:"last_logged_in"`
	Disabled     bool   `db:"disabled"`
	Admin        bool   `db:"admin"`
}

func ListUsers(db *sqlx.DB) ([]User, error) {
	query := `
		SELECT id, name, email, created, last_logged_in, disabled, admin
		FROM users
	`

	var users []User
	if err := db.Select(&users, query); err != nil {
		return nil, fmt.Errorf("failed to select users: %w", err)
	}
	if users == nil {
		return nil, nil
	}

	return users, nil
}
