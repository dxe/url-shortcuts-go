package model

import (
	"errors"
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

type ListShortcutOptions struct {
	Code  string
	Limit int
	Page  int
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

func CountShortcuts(db *sqlx.DB, code string) (int, error) {
	var total int
	query := "SELECT count(*) FROM shortcuts"
	var args []interface{}
	if code != "" {
		query += " WHERE code like ?"
		args = []interface{}{code + "%"}
	}
	err := db.QueryRowx(query, args...).Scan(&total)
	if err != nil {
		return 0, fmt.Errorf("failed to count total shortcut rows: %w", err)
	}
	return total, nil
}

func ListShortcuts(db *sqlx.DB, opts ListShortcutOptions) ([]Shortcut, int, error) {
	// TODO: join user name to display in UI?
	query := `
		SELECT id, code, url, created, created_by, updated, updated_by
		FROM shortcuts
	`
	var args []interface{}

	if opts.Code != "" {
		query += " WHERE code like ?"
		args = append(args, opts.Code+"%")
	}

	query += " ORDER BY updated DESC"

	if opts.Limit > 0 {
		query += " LIMIT ?, ?"
		args = append(args, (opts.Page-1)*opts.Limit)
		args = append(args, opts.Limit)
	}

	var shortcuts []Shortcut
	if err := db.Select(&shortcuts, query, args...); err != nil {
		return nil, 0, fmt.Errorf("failed to select shortcuts: %w", err)
	}
	if shortcuts == nil {
		return make([]Shortcut, 0), 0, nil
	}

	total, err := CountShortcuts(db, opts.Code)
	if err != nil {
		return nil, 0, err
	}

	return shortcuts, total, nil
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

type TopShortcut struct {
	ID          int    `db:"id"`
	Code        string `db:"code"`
	TotalVisits int64  `db:"total_visits"`
}

const (
	PeriodDay   = "DAY"
	PeriodWeek  = "WEEK"
	PeriodMonth = "MONTH"
	PeriodYear  = "YEAR"
)

func GetTopShortcuts(db *sqlx.DB, period string) ([]TopShortcut, error) {
	var validPeriods = map[string]struct{}{
		PeriodDay:   struct{}{},
		PeriodWeek:  struct{}{},
		PeriodMonth: struct{}{},
		PeriodYear:  struct{}{},
	}
	if _, ok := validPeriods[period]; !ok {
		return nil, errors.New("invalid period")
	}

	query := `
		select shortcut_id as id, code, count(*) as total_visits
		from visits
		join shortcuts on shortcuts.id = visits.shortcut_id
		where date(timestamp) > DATE_SUB(CURRENT_DATE, INTERVAL 1 ` + period + `)
		group by shortcut_id
		order by count(*) desc
		limit 10
	`
	shortcuts := make([]TopShortcut, 0)
	if err := db.Select(&shortcuts, query); err != nil {
		return shortcuts, fmt.Errorf("failed to select top shortcuts: %w", err)
	}

	return shortcuts, nil
}
