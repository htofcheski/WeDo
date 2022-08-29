package main

import (
	"html/template"
	"net/http"

	"github.com/gorilla/mux"
)

type State struct {
	Icon       string
	Production bool
	Data       map[string]interface{}
}

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
