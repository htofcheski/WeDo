package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"net/http"
	"time"

	"github.com/darahayes/go-boom"
	"github.com/gorilla/mux"
	_uuid "github.com/satori/go.uuid"
)

func ServeStatic(router *mux.Router, staticDirectory string) {
	staticPaths := map[string]string{
		"assets": staticDirectory + "/dist/",
	}
	for pathName, pathValue := range staticPaths {
		pathPrefix := "/" + pathName + "/"
		router.PathPrefix(pathPrefix).Handler(http.StripPrefix(pathPrefix,
			http.FileServer(http.Dir(pathValue))))
	}
}

func RunHTTP() error {
	router := mux.NewRouter()

	// not accessible from front end, used to create stuff that is outside of the scope of this project.
	router.HandleFunc("/create-organization", createOrganization).Methods("GET")
	router.HandleFunc("/create-organization-user", createOrganizationUser).Methods("GET")
	router.HandleFunc("/test", loginUser).Methods("GET")

	ServeStatic(router, "../client")

	router.HandleFunc("/", handleRoot).Methods("GET")

	return http.ListenAndServe("localhost:8000", sessionManager.LoadAndSave(router))
}

func handleRoot(w http.ResponseWriter, r *http.Request) {
	var templates *template.Template
	templates = template.Must(templates.ParseGlob("templates/*.html"))
	state_data := map[string]interface{}{
		"test": "test",
	}

	state := &State{
		Icon:       "",
		Production: false,
		Data:       state_data,
	}
	_, err := GetCurrentSession(r)

	if err != nil {
		templates.ExecuteTemplate(w, "login.html", state)
		return
	}

	templates.ExecuteTemplate(w, "index.html", state)
}

func createOrganization(w http.ResponseWriter, r *http.Request) {
	r_upgraded := UpgradeRequest(r)

	api_key := r_upgraded.QueryOrDefault("api_key", "")
	if api_key != API_KEY {
		msg := "[api_key] missing or invalid"
		boom.Unathorized(w, msg)
		Log.Error("createOrganization: " + msg)
		return
	}

	name := r_upgraded.QueryOrDefault("name", "")
	if len(name) < 3 {
		msg := "[name] missing or too short"
		boom.BadData(w, msg)
		Log.Error("createOrganization: " + msg)
		return
	}

	uuid := _uuid.NewV4()
	now := time.Now().UTC()

	_, err := DB.Queries.Exec(DB.postgre, "create-organization", uuid, name, now, now)
	if err != nil {
		boom.Internal(w, err.Error())
		Log.Error("createOrganization: " + err.Error())
		return
	}

	w.Write([]byte("OK!"))
}

func createOrganizationUser(w http.ResponseWriter, r *http.Request) {
	r_upgraded := UpgradeRequest(r)

	api_key := r_upgraded.QueryOrDefault("api_key", "")
	if api_key != API_KEY {
		msg := "[api_key] missing or invalid"
		boom.Unathorized(w, msg)
		Log.Error("createOrganizationUser: " + msg)
		return
	}

	org_uuid_str := r_upgraded.QueryOrDefault("org_uuid", "")
	org_uuid := _uuid.FromStringOrNil(org_uuid_str)
	if org_uuid == _uuid.Nil {
		msg := "[org_uuid] missing or invalid"
		boom.BadData(w, msg)
		Log.Error("createOrganizationUser: " + msg)
		return
	}
	organization_by_uuid, err := DB.Queries.Raw("organization-by-uuid")
	if err != nil {
		boom.Internal(w, err.Error())
		Log.Error("createOrganizationUser: " + err.Error())
		return
	}
	organization := &Organization{}
	DB.postgre.Get(organization, organization_by_uuid, org_uuid)
	if !organization.IsValid() {
		msg := "organization is invalid"
		boom.Internal(w, msg)
		Log.Error("createOrganizationUser: " + msg)
		return
	}

	username := r_upgraded.QueryOrDefault("username", "")
	if len(username) < 3 {
		msg := "[username] missing or too short"
		boom.BadData(w, msg)
		Log.Error("createOrganizationUser: " + msg)
		return
	}

	password := r_upgraded.QueryOrDefault("password", "")
	if len(password) < 8 {
		msg := "[password] missing or too short"
		boom.BadData(w, msg)
		Log.Error("createOrganizationUser: " + msg)
		return
	}
	password_salted, err := HashPassword(password)
	if err != nil {
		boom.Internal(w, err.Error())
		Log.Error("createOrganizationUser: " + err.Error())
		return
	}

	email := r_upgraded.QueryOrDefault("email", "")
	description := r_upgraded.QueryOrDefault("description", "")
	profile_picture := r_upgraded.QueryOrDefault("profile_picture", "")

	uuid := _uuid.NewV4()
	now := time.Now().UTC()

	_, err = DB.Queries.Exec(DB.postgre, "create-organization-user", uuid, organization.Index, username, password_salted, email, description, profile_picture, now, now)
	if err != nil {
		boom.Internal(w, err.Error())
		Log.Error("createOrganizationUser: " + err.Error())
		return
	}

	w.Write([]byte("OK!"))
}

func loginUser(w http.ResponseWriter, r *http.Request) {
	r_upgraded := UpgradeRequest(r)

	username := r_upgraded.QueryOrDefault("username", "")
	if len(username) < 3 {
		msg := "[username] missing or too short"
		boom.BadData(w, msg)
		Log.Error("loginUser: " + msg)
		return
	}

	password := r_upgraded.QueryOrDefault("password", "")

	if len(password) < 3 {
		msg := "[password] missing or too short"
		boom.BadData(w, msg)
		Log.Error("loginUser: " + msg)
		return
	}

	logReq := &LoginRequest{Username: username, Password: password}

	user_uuid, err := authUser(logReq)
	if err != nil {
		fmt.Println("[[Login user]]:", err)
		w.Write([]byte("NOT OK"))
		return
	}

	// Create new session
	token, err := CreateNewSession(r.Context(), user_uuid)
	if err != nil {
		fmt.Println("[[Create new session]]:", err)
		w.Write([]byte("NOT OK"))
		return
	}

	cookie1 := &http.Cookie{Name: "test", Value: token, HttpOnly: true}
	http.SetCookie(w, cookie1)
	writeJSONResponse(w, []byte("OK!"), http.StatusCreated)
}

func writeJSONResponse(w http.ResponseWriter, data interface{}, status int) {
	js, err := json.Marshal(data)
	if err != nil {
		fmt.Println("[[writeJSONResponse]]:", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(js)
}
