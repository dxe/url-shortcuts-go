package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"

	"github.com/dxe/url-shortcuts-go/model"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/jwtauth/v5"
	"github.com/jmoiron/sqlx"
)

// Cookie names.
const (
	cookieJWT       = "jwt"
	cookieAuthState = "auth_state"
)

type server struct {
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

func main() {
	googleOauthConfig := &oauth2.Config{
		RedirectURL:  mustGetEnv("BASE_URL") + "/auth/callback",
		ClientID:     mustGetEnv("OAUTH_CLIENT_ID"),
		ClientSecret: mustGetEnv("OAUTH_CLIENT_SECRET"),
		Scopes:       []string{"email", "profile"},
		Endpoint:     google.Endpoint,
	}

	tokenAuth := jwtauth.New("HS256", []byte(mustGetEnv("JWT_SECRET")), nil)

	db := model.InitDBConn(mustGetEnv("DB_DSN"))

	s := server{
		port:              mustGetEnvInt("PORT"),
		db:                db,
		googleOauthConfig: googleOauthConfig,
		tokenAuth:         tokenAuth,
	}

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))

	// Public routes
	// TODO: ensure shortcuts don't use these reserved routes (or split it onto a different router by host or port?)
	r.Get("/healthz", s.handleHealthcheck)
	r.Get("/", s.handleIndex)
	r.Get("/login", s.handleGoogleLogin)
	r.Get("/logout", s.handleLogout)
	r.Get("/auth/callback", s.handleGoogleCallback)
	r.Get("/*", s.handleRedirect)

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(jwtauth.Verifier(tokenAuth))
		r.Use(jwtauth.Authenticator)
		r.Use(userCtx)
		r.Use(userAuthorizer)

		r.Get("/private", func(w http.ResponseWriter, r *http.Request) {
			user := mustGetUserFromCtx(r.Context())
			w.Write([]byte(fmt.Sprintf("This is a private page. Hi, %v.", user.Name)))
		})

		// Admin routes
		r.Group(func(r chi.Router) {
			r.Use(adminAuthorizer)

			r.Get("/admin", func(w http.ResponseWriter, r *http.Request) {
				w.Write([]byte("Hello, admin!"))
			})
		})
	})

	addr := ":" + strconv.Itoa(s.port)
	log.Printf("Server started. Listening on %v.", addr)
	log.Fatalln(http.ListenAndServe(addr, r))
}

func (s *server) handleRedirect(w http.ResponseWriter, r *http.Request) {
	// TODO: ensure this is the correct way to get the code (may need to remove any url parameters, etc.)
	code := r.URL.Path
	log.Printf("Code from request: %v\n", code)

	url, err := model.GetRedirectURL(s.db, code)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if url == "" {
		http.Error(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
		return
	}
	// TODO: ensure that we forward the Referer header & any url parameters
	http.Redirect(w, r, url, http.StatusFound)
	// TODO: log a visit in the database
}

func (s *server) handleHealthcheck(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte(`OK`))
}

func (s *server) handleIndex(w http.ResponseWriter, r *http.Request) {
	// TODO: index should just redirect to homepage eventually
	w.Write([]byte(`<a href="/login">Log in</a>`))
}

func (s *server) handleLogout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:   cookieAuthState,
		MaxAge: -1,
	})
	http.SetCookie(w, &http.Cookie{
		Name:   cookieJWT,
		MaxAge: -1,
	})
	http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
}

func (s *server) handleGoogleLogin(w http.ResponseWriter, r *http.Request) {
	state, err := nonce()
	if err != nil {
		w.Write([]byte("Error generating auth state cookie."))
		return
	}
	http.SetCookie(w, &http.Cookie{
		Name:     cookieAuthState,
		Value:    state,
		MaxAge:   int((time.Minute * 1).Seconds()), // how long the user has to complete the authentication process
		SameSite: http.SameSiteLaxMode,
		HttpOnly: true,
		Path:     "/",
	})
	url := s.googleOauthConfig.AuthCodeURL(state, oauth2.SetAuthURLParam("prompt", "select_account"))
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func (s *server) handleGoogleCallback(w http.ResponseWriter, r *http.Request) {
	c, err := r.Cookie(cookieAuthState)
	if err != nil {
		w.Write([]byte("Error reading auth state cookie."))
		return
	}
	if c.Value != r.FormValue("state") {
		w.Write([]byte("State mismatch."))
		return
	}

	googleAcctInfo, err := s.getUserGoogleAcctInfo(r.Context(), r.FormValue("code"))
	if err != nil {
		fmt.Errorf("error getting user's google account info: %w", err)
		http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
		return
	}

	// TODO: check against the database to see if the user is an authorized user, admin, or unauthorized
	dummyUser := User{ // TODO: replace w/ real user from database
		ID:         1,
		Name:       "Jake Hobbs",
		Email:      "jake@dxe.io",
		Authorized: true,
		Admin:      true,
	}

	claims := map[string]interface{}{"user": dummyUser}
	jwtauth.SetExpiryIn(claims, 8*time.Hour)
	jwtauth.SetIssuedNow(claims)

	// generate jwt
	_, tokenString, err := s.tokenAuth.Encode(claims)
	if err != nil {
		w.Write([]byte("Failed to generate token."))
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     cookieJWT,
		Value:    tokenString,
		MaxAge:   int((time.Hour * 8).Seconds()), // how long until user must log in again
		SameSite: http.SameSiteLaxMode,
		HttpOnly: true,
		Path:     "/",
	})

	w.Write([]byte(fmt.Sprintf("%+v", googleAcctInfo))) // TODO: replace w/ redirect since user is now logged in
}

func (s *server) getUserGoogleAcctInfo(ctx context.Context, code string) (GoogleAccountInfo, error) {
	var accountInfo GoogleAccountInfo

	token, err := s.googleOauthConfig.Exchange(ctx, code)
	if err != nil {
		return accountInfo, fmt.Errorf("code exchange failed: %w", err)
	}

	response, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + token.AccessToken)
	if err != nil {
		return accountInfo, fmt.Errorf("failed getting user info: %w", err)
	}
	defer response.Body.Close()

	json.NewDecoder(response.Body).Decode(&accountInfo)

	if !accountInfo.VerifiedEmail {
		return accountInfo, fmt.Errorf("email address is not verified: %w", err)
	}

	return accountInfo, nil
}

func userCtx(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, claims, err := jwtauth.FromContext(r.Context())
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}

		jsonBody, err := json.Marshal(claims["user"])
		if err != nil {
			http.Error(w, "Failed to marshal user object.", http.StatusInternalServerError)
			return
		}
		var user User
		if err := json.Unmarshal(jsonBody, &user); err != nil {
			http.Error(w, "Failed to unmarshal user object.", http.StatusInternalServerError)
			return
		}

		ctx := context.WithValue(r.Context(), "user", user)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func mustGetUserFromCtx(ctx context.Context) User {
	user, ok := ctx.Value("user").(User)
	if !ok {
		panic("user not found in context")
	}
	return user
}

func userAuthorizer(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user := mustGetUserFromCtx(r.Context())

		if !user.Authorized {
			http.Error(w, "You are not authorized!", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func adminAuthorizer(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user := mustGetUserFromCtx(r.Context())

		if !user.Admin {
			http.Error(w, "You are not an admin!", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// nonce returns a 256-bit random hex string.
func nonce() (string, error) {
	var buf [32]byte
	if _, err := io.ReadFull(rand.Reader, buf[:]); err != nil {
		return "", err
	}
	return hex.EncodeToString(buf[:]), nil
}

type GoogleAccountInfo struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
}

// TODO: move to model
type User struct {
	ID         int
	Name       string
	Email      string
	Authorized bool
	Admin      bool
}
