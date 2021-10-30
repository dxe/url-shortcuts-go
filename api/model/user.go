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
	LastLoggedIn string `db:"last_logged_in"` // TODO: allow null if user has never logged in
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

func InsertUser(db *sqlx.DB, user User) error {
	query := `
		INSERT INTO users (id, name, email, disabled, admin)
		VALUES (:id, :name, :email, :disabled, :admin) 
	`

	_, err := sqlx.NamedExec(db, query, user)
	if err != nil {
		return fmt.Errorf("error inserting user: %w", err)
	}

	return nil
}

func UpdateUser(db *sqlx.DB, user User) error {
	query := `
		UPDATE users
		SET name = :name,
			email = :email,
			last_logged_in = :last_logged_in,
			disabled = :disabled,
			admin = :admin
		WHERE id = :id
	`

	_, err := sqlx.NamedExec(db, query, user)
	if err != nil {
		return fmt.Errorf("error updating user: %w", err)
	}

	return nil
}
