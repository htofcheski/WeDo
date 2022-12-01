package main

import (
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

	ServeStatic(router, "../client")

	router.HandleFunc("/", handleRoot).Methods("GET")

	return http.ListenAndServe("localhost:8000", router)
}

func handleRoot(w http.ResponseWriter, r *http.Request) {
	state_data := map[string]interface{}{
		"test": "test",
	}

	state := &State{
		Icon:       "",
		Production: false,
		Data:       state_data,
	}

	var templates *template.Template

	templates = template.Must(templates.ParseGlob("templates/*.html"))

	templates.ExecuteTemplate(w, "index.html", state)
}

func createOrganization(w http.ResponseWriter, r *http.Request) {
	r_upgraded := UpgradeRequest(r)

	api_key := r_upgraded.QueryOrDefault("api_key", "")
	if api_key != API_KEY {
		boom.Unathorized(w, "[api_key] missing or invalid")
		return
	}

	name := r_upgraded.QueryOrDefault("name", "")
	if len(name) < 3 {
		boom.BadData(w, "[name] missing or too short")
		return
	}

	uuid := _uuid.NewV4()
	now := time.Now().UTC()

	_, err := DB.Queries.Exec(DB.postgre, "create-organization", uuid, name, now, now)
	if err != nil {
		boom.Internal(w, err.Error())
		return
	}

	w.Write([]byte("OK!"))
}

func createOrganizationUser(w http.ResponseWriter, r *http.Request) {
	r_upgraded := UpgradeRequest(r)

	api_key := r_upgraded.QueryOrDefault("api_key", "")
	if api_key != API_KEY {
		boom.Unathorized(w, "[api_key] missing or invalid")
		return
	}

	org_uuid_str := r_upgraded.QueryOrDefault("org_uuid", "")
	org_uuid := _uuid.FromStringOrNil(org_uuid_str)
	if org_uuid == _uuid.Nil {
		boom.BadData(w, "[org_uuid] missing or invalid")
		return
	}
	organization_by_uuid, err := DB.Queries.Raw("organization-by-uuid")
	if err != nil {
		boom.Internal(w, err.Error())
		return
	}
	organization := &Organization{}
	DB.postgre.Get(organization, organization_by_uuid, org_uuid)
	if !organization.IsValid() {
		boom.Internal(w, "organization is invalid")
		return
	}

	username := r_upgraded.QueryOrDefault("username", "")
	if len(username) < 3 {
		boom.BadData(w, "[username] missing or too short")
		return
	}

	password := r_upgraded.QueryOrDefault("password", "")
	if len(password) < 8 {
		boom.BadData(w, "[password] missing or too short")
		return
	}
	// hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	// if err != nil {
	// 	boom.Internal(w, err.Error())
	// 	return
	// }
	// password_salted := string(hash)
	// fmt.Println(password_salted)

	// email := r_upgraded.QueryOrDefault("email", "")
	// description := r_upgraded.QueryOrDefault("description", "")
	// profile_picture := r_upgraded.QueryOrDefault("profile_picture", "")

	// uuid := _uuid.NewV4()
	// now := time.Now().UTC()

	w.Write([]byte("OK!"))
}
