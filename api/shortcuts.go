package main

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/dxe/url-shortcuts-go/model"
	"github.com/go-chi/chi/v5"
)

func (s *server) getShortcuts(w http.ResponseWriter, r *http.Request) {
	shortcuts, err := model.ListShortcuts(s.db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, map[string]interface{}{
		"shortcuts": shortcuts,
	})
}

func (s *server) createShortcut(w http.ResponseWriter, r *http.Request) {
	user := mustGetUserFromCtx(r.Context())

	// TODO: validate input data
	var shortcut model.Shortcut
	err := json.NewDecoder(r.Body).Decode(&shortcut)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	shortcut.CreatedBy, shortcut.UpdatedBy = user.ID, user.ID

	id, err := model.InsertShortcut(s.db, shortcut)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]interface{}{
		"id": id,
	})
}

func (s *server) updateShortcut(w http.ResponseWriter, r *http.Request) {
	user := mustGetUserFromCtx(r.Context())

	idParam := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// TODO: validate input data
	var shortcut model.Shortcut
	err = json.NewDecoder(r.Body).Decode(&shortcut)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	shortcut.ID = id
	shortcut.UpdatedBy = user.ID

	err = model.UpdateShortcut(s.db, shortcut)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]interface{}{
		"id": id,
	})
}

func (s *server) deleteShortcut(w http.ResponseWriter, r *http.Request) {
	idParam := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err = model.DeleteShortcut(s.db, model.Shortcut{ID: id})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]interface{}{
		"id": id,
	})
}
