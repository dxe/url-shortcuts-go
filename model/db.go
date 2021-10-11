package model

import (
	"log"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
)

func InitDBConn(dsn string) *sqlx.DB {
	db, err := sqlx.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err.Error())
	}

	db.SetConnMaxLifetime(4 * time.Hour)
	db.SetConnMaxIdleTime(15 * time.Minute)

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to establish connection to database: %v", err.Error())
	}

	log.Println("Connected to database")

	return db
}
