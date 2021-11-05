package model

import (
	"errors"
	"fmt"

	"github.com/jmoiron/sqlx"
)

type User struct {
	ID           int    `db:"id"`
	Name         string `db:"name"`
	Email        string `db:"email"`
	CreatedAt    string `db:"created"`
	LastLoggedIn string `db:"last_logged_in"`
	Active       bool   `db:"active"`
	Admin        bool   `db:"admin"`
}

func FindUserByEmail(db *sqlx.DB, email string) (User, error) {
	query := `
		SELECT id, name, email, created, IFNULL(last_logged_in,"Never") as last_logged_in, active, admin
		FROM users
		WHERE email = ?
	`

	var users []User
	if err := db.Select(&users, query, email); err != nil {
		return User{}, fmt.Errorf("failed to select users: %w", err)
	}
	if users == nil {
		return User{}, nil
	}
	return users[0], nil
}

func ListUsers(db *sqlx.DB) ([]User, error) {
	query := `
		SELECT id, name, email, created, IFNULL(last_logged_in,"Never") as last_logged_in, active, admin
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

func InsertUser(db *sqlx.DB, user User) (int64, error) {
	query := `
		INSERT INTO users (name, email, active, admin)
		VALUES (:name, :email, :active, :admin) 
	`

	res, err := sqlx.NamedExec(db, query, user)
	if err != nil {
		return 0, fmt.Errorf("error inserting user: %w", err)
	}

	id, err := res.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("error getting id of inserted user: %w", err)
	}

	return id, nil
}

func CreateAndReturnUser(db *sqlx.DB, u User) (User, error) {
	_, err := InsertUser(db, u)
	if err != nil {
		return User{}, err
	}
	user, err := FindUserByEmail(db, u.Email)
	if err != nil {
		return User{}, err
	}

	if userExists := user.ID > 0; !userExists {
		return User{}, errors.New("newly created user does not exist")
	}

	return user, nil
}

func UpdateUser(db *sqlx.DB, user User) error {
	query := `
		UPDATE users
		SET name = :name,
			email = :email,
			active = :active,
			admin = :admin
		WHERE id = :id
	`

	_, err := sqlx.NamedExec(db, query, user)
	if err != nil {
		return fmt.Errorf("error updating user: %w", err)
	}

	return nil
}

func DeleteUser(db *sqlx.DB, user User) error {
	query := `
		DELETE FROM users
		WHERE id = :id
	`

	_, err := sqlx.NamedExec(db, query, user)
	if err != nil {
		return fmt.Errorf("error deleting user: %w", err)
	}

	return nil
}

func UpdateUserLastLoggedIn(db *sqlx.DB, user User) error {
	query := `
		UPDATE users
		SET last_logged_in = CURRENT_TIMESTAMP
		WHERE id = :id
	`

	_, err := sqlx.NamedExec(db, query, user)
	if err != nil {
		return fmt.Errorf("error updating user: %w", err)
	}

	return nil
}
