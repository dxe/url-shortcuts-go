package main

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/dxe/url-shortcuts-go/model"
	"github.com/go-chi/chi/v5"
)

func (s *server) getUsers(w http.ResponseWriter, r *http.Request) {
	users, err := model.ListUsers(s.db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, map[string]interface{}{
		"users": users,
	})
}

func (s *server) createUser(w http.ResponseWriter, r *http.Request) {
	// TODO: validate input data
	var user model.User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	id, err := model.InsertUser(s.db, user)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]interface{}{
		"id": id,
	})
}

func (s *server) updateUser(w http.ResponseWriter, r *http.Request) {
	idParam := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// TODO: validate input data
	var user model.User
	err = json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user.ID = id

	err = model.UpdateUser(s.db, user)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]interface{}{
		"id": id,
	})
}

func (s *server) deleteUser(w http.ResponseWriter, r *http.Request) {
	idParam := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err = model.DeleteUser(s.db, model.User{ID: id})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]interface{}{
		"id": id,
	})
}

func (s *server) getCurrentUser(w http.ResponseWriter, r *http.Request) {
	user := mustGetUserFromCtx(r.Context())
	writeJSON(w, map[string]interface{}{
		"user": user,
	})
}