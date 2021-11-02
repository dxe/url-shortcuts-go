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
	"net/url"
	"os"
	"strconv"
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

	// TODO: modify these options if needed
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:8080", "https://shortcuts.dxe.io"}, // TODO: use env?
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Public routes
	// TODO: ensure shortcuts don't use these reserved routes (or split it onto a different router by host or port?)
	r.Get("/healthz", s.handleHealthcheck)
	r.Get("/login", s.handleGoogleLogin)
	r.Get("/logout", s.handleLogout)
	r.Get("/auth/callback", s.handleGoogleCallback)

	// Redirect to whatever the short link points to
	r.Get("/*", s.handleRedirect)

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(jwtauth.Verifier(tokenAuth))
		r.Use(jwtauth.Authenticator)
		r.Use(userCtx)
		r.Use(userAuthorizer)

		// TODO: maybe use subrouter or something here to avoid repeating "/api/shortcuts", etc.
		r.Get("/api/shortcuts", func(w http.ResponseWriter, r *http.Request) {
			//user := mustGetUserFromCtx(r.Context())
			shortcuts, err := model.ListShortcuts(s.db)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			// TODO: refactor to have a reusable json function
			w.Header().Set("Content-Type", "application/json")
			b, err := json.Marshal(shortcuts)
			if err != nil {
				http.Error(w, err.Error(), http.StatusUnprocessableEntity)
				return
			}
			w.Write(b)
		})

		r.Post("/api/shortcuts", func(w http.ResponseWriter, r *http.Request) {
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

			// TODO: refactor to have a reusable json function
			w.Header().Set("Content-Type", "application/json")
			b, err := json.Marshal(map[string]interface{}{
				"id": id,
			})
			if err != nil {
				http.Error(w, err.Error(), http.StatusUnprocessableEntity)
				return
			}
			w.Write(b)
		})

		r.Patch("/api/shortcuts/{id}", func(w http.ResponseWriter, r *http.Request) {
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

			log.Println(shortcut)

			err = model.UpdateShortcut(s.db, shortcut)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			// TODO: refactor to have a reusable json function
			w.Header().Set("Content-Type", "application/json")
			b, err := json.Marshal(map[string]interface{}{
				"id": id,
			})
			if err != nil {
				http.Error(w, err.Error(), http.StatusUnprocessableEntity)
				return
			}
			w.Write(b)
		})

		r.Delete("/api/shortcuts/{id}", func(w http.ResponseWriter, r *http.Request) {
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

			// TODO: refactor to have a reusable json function
			w.Header().Set("Content-Type", "application/json")
			b, err := json.Marshal(map[string]interface{}{
				"id": id,
			})
			if err != nil {
				http.Error(w, err.Error(), http.StatusUnprocessableEntity)
				return
			}
			w.Write(b)
		})

		// Admin routes
		r.Group(func(r chi.Router) {
			r.Use(adminAuthorizer)

			// TODO: maybe use subrouter or something here to avoid repeating "/api/users", etc.
			r.Get("/api/users", func(w http.ResponseWriter, r *http.Request) {
				users, err := model.ListUsers(s.db)
				if err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
				// TODO: refactor to have a reusable json function
				w.Header().Set("Content-Type", "application/json")
				b, err := json.Marshal(users)
				if err != nil {
					http.Error(w, err.Error(), http.StatusUnprocessableEntity)
					return
				}
				w.Write(b)
			})

			r.Post("/api/users", func(w http.ResponseWriter, r *http.Request) {
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

				// TODO: refactor to have a reusable json function
				w.Header().Set("Content-Type", "application/json")
				b, err := json.Marshal(map[string]interface{}{
					"id": id,
				})
				if err != nil {
					http.Error(w, err.Error(), http.StatusUnprocessableEntity)
					return
				}
				w.Write(b)
			})

			r.Patch("/api/users/{id}", func(w http.ResponseWriter, r *http.Request) {
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

				// TODO: refactor to have a reusable json function
				w.Header().Set("Content-Type", "application/json")
				b, err := json.Marshal(map[string]interface{}{
					"id": id,
				})
				if err != nil {
					http.Error(w, err.Error(), http.StatusUnprocessableEntity)
					return
				}
				w.Write(b)
			})

			r.Delete("/api/users/{id}", func(w http.ResponseWriter, r *http.Request) {
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

				// TODO: refactor to have a reusable json function
				w.Header().Set("Content-Type", "application/json")
				b, err := json.Marshal(map[string]interface{}{
					"id": id,
				})
				if err != nil {
					http.Error(w, err.Error(), http.StatusUnprocessableEntity)
					return
				}
				w.Write(b)
			})

		})
	})

	addr := ":" + strconv.Itoa(s.port)
	log.Printf("Server started. Listening on %v.", addr)
	log.Fatalln(http.ListenAndServe(addr, r))
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

func (s *server) handleHealthcheck(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte(`OK`))
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
	http.Redirect(w, r, "http://localhost:8080", http.StatusTemporaryRedirect) // TODO: move to env?
}

func (s *server) handleGoogleLogin(w http.ResponseWriter, r *http.Request) {
	state, err := nonce()
	if err != nil {
		http.Error(w, "Error generating auth state cookie: "+err.Error(), http.StatusInternalServerError)
		return
	}
	http.SetCookie(w, &http.Cookie{
		Name:     cookieAuthState,
		Value:    state,
		Expires:  time.Now().Add(time.Minute * 1), // how long the user has to complete the authentication process
		SameSite: http.SameSiteNoneMode,           // TODO: use Lax for prod
		HttpOnly: true,
		Path:     "/",
	})
	path := s.googleOauthConfig.AuthCodeURL(state, oauth2.SetAuthURLParam("prompt", "select_account"))
	http.Redirect(w, r, path, http.StatusTemporaryRedirect)
}

func (s *server) handleGoogleCallback(w http.ResponseWriter, r *http.Request) {
	c, err := r.Cookie(cookieAuthState)
	if err != nil {
		http.Error(w, "Error reading auth state cookie: "+err.Error(), http.StatusBadRequest)
		return
	}
	if c.Value != r.FormValue("state") {
		http.Error(w, "State mismatch: "+err.Error(), http.StatusBadRequest)
		return
	}

	googleAcctInfo, err := s.getUserGoogleAcctInfo(r.Context(), r.FormValue("code"))
	if err != nil {
		fmt.Errorf("error getting user's google account info: %w", err)
		http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
		return
	}

	user, err := model.FindUserByEmail(s.db, googleAcctInfo.Email)
	if err != nil {
		http.Error(w, "Error finding user by email: "+err.Error(), http.StatusInternalServerError)
		return
	}

	err = model.UpdateUserLastLoggedIn(s.db, user)
	if err != nil {
		http.Error(w, "Failed to update user last login time: "+err.Error(), http.StatusInternalServerError)
		return
	}

	claims := map[string]interface{}{"user": user}
	jwtauth.SetExpiryIn(claims, 8*time.Hour)
	jwtauth.SetIssuedNow(claims)

	// generate jwt
	_, tokenString, err := s.tokenAuth.Encode(claims)
	if err != nil {
		http.Error(w, "Failed to generate token: "+err.Error(), http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     cookieJWT,
		Value:    tokenString,
		Expires:  time.Now().Add(time.Hour * 8), // how long until user must log in again
		SameSite: http.SameSiteNoneMode,         // TODO: use Lax for prod
		HttpOnly: true,
		Path:     "/",
		// Domain:   "shortcuts.dxe.io", // TODO: explore this option
	})

	http.Redirect(w, r, "http://localhost:8080", http.StatusFound) // TODO: use env?
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
		var user model.User
		if err := json.Unmarshal(jsonBody, &user); err != nil {
			http.Error(w, "Failed to unmarshal user object.", http.StatusInternalServerError)
			return
		}

		ctx := context.WithValue(r.Context(), "user", user)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func mustGetUserFromCtx(ctx context.Context) model.User {
	user, ok := ctx.Value("user").(model.User)
	if !ok {
		panic("user not found in context")
	}
	return user
}

func userAuthorizer(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user := mustGetUserFromCtx(r.Context())

		if !user.Active {
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
