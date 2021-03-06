package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/dxe/url-shortcuts-go/model"
	"github.com/go-chi/jwtauth/v5"
	"golang.org/x/oauth2"
)

// Cookie names.
const (
	cookieJWT       = "jwt"
	cookieAuthState = "auth_state"
)

func (s *server) handleLogout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:   cookieAuthState,
		Path:   "/",
		MaxAge: -1,
	})
	http.SetCookie(w, &http.Cookie{
		Name:   cookieJWT,
		Path:   "/",
		MaxAge: -1,
	})
	http.Redirect(w, r, s.homepagePath(), http.StatusTemporaryRedirect)
}

func (s *server) handleLogin(w http.ResponseWriter, r *http.Request) {
	if s.prod {
		s.handleGoogleLogin(w, r)
		return
	}

	// Mock auth for development.
	mockUser := model.User{
		ID:     1,
		Name:   "Dev Admin",
		Email:  "admin@dxe.io",
		Active: true,
		Admin:  true,
	}
	s.issueJWTToken(mockUser, w)
	http.Redirect(w, r, s.homepagePath(), http.StatusFound)
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
		SameSite: http.SameSiteLaxMode,            // TODO: ensure this works in prod
		HttpOnly: true,
		Path:     "/",
		Secure:   true,
	})
	path := s.googleOauthConfig.AuthCodeURL(state, oauth2.SetAuthURLParam("prompt", "select_account"))
	http.Redirect(w, r, path, http.StatusTemporaryRedirect)
}

func (s *server) handleGoogleCallback(w http.ResponseWriter, r *http.Request) {
	c, err := r.Cookie(cookieAuthState)
	if err != nil {
		http.Error(w, "Error reading auth state cookie: "+err.Error(), http.StatusUnauthorized)
		return
	}
	if c.Value != r.FormValue("state") {
		http.Error(w, "State mismatch: "+err.Error(), http.StatusUnauthorized)
		return
	}

	googleAcctInfo, err := s.getUserGoogleAcctInfo(r.Context(), r.FormValue("code"))
	if err != nil {
		http.Error(w, "Error getting Google Account info: "+err.Error(), http.StatusUnauthorized)
		return
	}

	user, err := model.FindUserByEmail(s.db, googleAcctInfo.Email)
	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	if userExists := user.ID > 0; !userExists {
		// User does not exist in database.
		if isDxeEmail(googleAcctInfo.Email) {
			// User has a DxE email address, so just create an account for them.
			user, err = model.CreateAndReturnUser(s.db, model.User{
				Name:   googleAcctInfo.Name,
				Email:  googleAcctInfo.Email,
				Active: true,
				Admin:  false,
			})
			if err != nil {
				http.Error(w, "Failed to create new user.", http.StatusInternalServerError)
				return
			}
		} else {
			// User does not have a DxE email address, so they are unauthorized.
			http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
			return
		}
	}

	err = model.UpdateUserLastLoggedIn(s.db, user)
	if err != nil {
		http.Error(w, "Failed to update user last login time: "+err.Error(), http.StatusInternalServerError)
		return
	}

	s.issueJWTToken(user, w)
	http.Redirect(w, r, s.homepagePath(), http.StatusFound)
}

func (s *server) issueJWTToken(user model.User, w http.ResponseWriter) {
	claims := map[string]interface{}{"user": user}
	jwtauth.SetExpiryIn(claims, 8*time.Hour)
	jwtauth.SetIssuedNow(claims)

	_, tokenString, err := s.tokenAuth.Encode(claims)
	if err != nil {
		http.Error(w, "Failed to generate token: "+err.Error(), http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     cookieJWT,
		Value:    tokenString,
		Expires:  time.Now().Add(time.Hour * 8), // how long until user must log in again
		SameSite: http.SameSiteLaxMode,
		HttpOnly: true,
		Path:     "/",
		Secure:   s.prod,
	})
}

type GoogleAccountInfo struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
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

func isDxeEmail(address string) bool {
	const domain = "directactioneverywhere.com"
	return strings.HasSuffix(address, domain)
}
