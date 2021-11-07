package main

import (
	"encoding/json"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"

	"github.com/dxe/url-shortcuts-go/model"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-chi/jwtauth/v5"
	"github.com/jmoiron/sqlx"
)

type server struct {
	prod              bool
	port              int
	db                *sqlx.DB
	googleOauthConfig *oauth2.Config
	tokenAuth         *jwtauth.JWTAuth
}

func mustGetEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("failed to get env for key %v", key)
	}
	return v
}

func mustGetEnvInt(key string) int {
	v := mustGetEnv(key)
	x, err := strconv.Atoi(v)
	if err != nil {
		log.Fatalf("expected env value for key %v to be int", key)
	}
	return x
}

func mustGetEnvBool(key string) bool {
	v := mustGetEnv(key)
	return strings.ToLower(v) == "true" || v == "1"
}

func main() {
	googleOauthConfig := &oauth2.Config{
		RedirectURL:  mustGetEnv("BASE_URL") + "/auth/callback",
		ClientID:     mustGetEnv("OAUTH_CLIENT_ID"),
		ClientSecret: mustGetEnv("OAUTH_CLIENT_SECRET"),
		Scopes:       []string{"email", "profile"},
		Endpoint:     google.Endpoint,
	}

	s := server{
		prod:              mustGetEnvBool("PROD"),
		port:              mustGetEnvInt("PORT"),
		db:                model.InitDBConn(mustGetEnv("DB_DSN")),
		googleOauthConfig: googleOauthConfig,
		tokenAuth:         jwtauth.New("HS256", []byte(mustGetEnv("JWT_SECRET")), nil),
	}

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))

	// TODO: modify these options if needed
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://dxe.io", "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Public routes
	r.Get("/healthz", s.handleHealthcheck)

	r.Route("/auth", func(r chi.Router) {
		r.Get("/login", s.handleLogin)
		r.Get("/logout", s.handleLogout)
		r.Get("/callback", s.handleGoogleCallback)
	})

	// Protected API routes
	r.Route("/api", s.apiRouter)

	// Redirect to whatever the short link points to
	r.Get("/*", s.handleRedirect)

	addr := ":" + strconv.Itoa(s.port)
	log.Printf("Server started. Listening on %v.", addr)
	log.Fatalln(http.ListenAndServe(addr, r))
}

func (s *server) apiRouter(r chi.Router) {
	r.Use(jwtauth.Verifier(s.tokenAuth))
	r.Use(jwtauth.Authenticator)
	r.Use(userCtx)
	r.Use(userAuthorizer)

	r.Get("/me", s.getCurrentUser)

	r.Route("/shortcuts", func(r chi.Router) {
		r.Get("/", s.getShortcuts)
		r.Post("/", s.createShortcut)
		r.Put("/{id}", s.updateShortcut)
		r.Delete("/{id}", s.deleteShortcut)
		r.Get("/top", s.getTopShortcuts)
	})

	r.Route("/users", func(r chi.Router) {
		r.Use(adminAuthorizer)
		r.Get("/", s.getUsers)
		r.Post("/", s.createUser)
		r.Put("/{id}", s.updateUser)
		r.Delete("/{id}", s.deleteUser)
	})
}

func (s *server) handleHealthcheck(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte(`OK`))
}

func (s *server) handleRedirect(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Path[1:]
	log.Printf("Code from request: %v\n", code)

	shortcut, err := model.GetShortcutByCode(s.db, code)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if shortcut.ID == 0 {
		path := "http://directactioneverywhere.com/" + code // TODO: move domain to env
		http.Redirect(w, r, path, http.StatusFound)
		return
	}

	path, err := url.Parse(shortcut.URL)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	path.RawQuery = buildQueryString(code, path.Query(), r.URL.Query())
	// TODO: ensure that we forward the Referer header
	http.Redirect(w, r, path.String(), http.StatusFound)

	if err := model.InsertVisit(s.db, model.Visit{
		ShortcutID: shortcut.ID,
		IPAddress:  r.RemoteAddr,
		Path:       r.URL.String(),
		Referer:    r.Header.Get("Referer"),
		UserAgent:  r.Header.Get("User-Agent"),
	}); err != nil {
		log.Println(err)
	}

}

func buildQueryString(campaign string, args ...url.Values) string {
	output := make(url.Values, 0)
	for _, u := range args {
		for k, v := range u {
			output.Set(k, v[0])
		}
	}
	output.Set("utm_campaign", "dxe-io-"+campaign)
	return output.Encode()
}

func writeJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	b, err := json.Marshal(data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnprocessableEntity)
		return
	}
	w.Write(b)
}

func (s *server) homepagePath() string {
	const (
		// In prod, this redirects to the frontend server via the load balancer.
		pathProd = "/shortcuts"
		// In development, this redirects to the React dev server.
		pathLocal = "http://localhost:3000/shortcuts" // TODO: move port to env
	)
	if s.prod {
		return pathProd
	}
	return pathLocal
}
