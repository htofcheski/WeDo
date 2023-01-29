package main

import (
	"database/sql"
	"encoding/json"
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
	////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Not accessible from front end, used to create stuff that is outside of the scope of this project. //
	router.HandleFunc("/api/v1/create-organization", createOrganization).Methods("GET")
	router.HandleFunc("/api/v1/create-organization-user", createOrganizationUser).Methods("GET")
	router.HandleFunc("/api/v1/create-team", createTeam).Methods("GET")
	router.HandleFunc("/api/v1/create-team-user", createTeamUser).Methods("GET")
	////////////////////////////////////////////////////////////////////////////////////////////////////////
	router.HandleFunc("/api/v1/login", loginUser).Methods("GET")
	router.HandleFunc("/api/v1/team-state", teamState).Methods("GET")
	router.HandleFunc("/api/v1/logout", logoutUser).Methods("GET")
	////////////////////////////////////////////////////////////////////////////////////////////////////////
	router.HandleFunc("/api/v1/create-project", createProject).Methods("POST")
	router.HandleFunc("/api/v1/update-project", updateProject).Methods("POST")
	router.HandleFunc("/api/v1/delete-project", deleteProject).Methods("POST")
	////////////////////////////////////////////////////////////////////////////////////////////////////////
	router.HandleFunc("/api/v1/create-task", createTask).Methods("POST")
	router.HandleFunc("/api/v1/update-task", updateTask).Methods("POST")
	router.HandleFunc("/api/v1/delete-task", deleteTask).Methods("POST")

	ServeStatic(router, "../client")

	router.HandleFunc("/", handleRoot).Methods("GET")

	return http.ListenAndServe("localhost:2023", sessionManager.LoadAndSave(router))
}

func handleRoot(w http.ResponseWriter, r *http.Request) {
	var templates *template.Template
	templates = template.Must(templates.ParseGlob("templates/*.html"))
	state_data := map[string]interface{}{}

	state := &State{
		Icon:       "assets/src/img/logo.png",
		Production: false,
		Data:       state_data,
	}

	org_user, org, teams, teams_user, err := apiUserState(r)
	if err != nil {
		templates.ExecuteTemplate(w, "login.html", state)
		return
	}

	state_data["logged_in_org_user"] = org_user
	state_data["teams_user_for_logged_in_org_user"] = teams_user
	state_data["organization"] = org
	state_data["teams"] = teams

	state.Data = state_data

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

	organization := &Organization{}
	err := DB.postgre.Get(organization, DB.QueriesRawMap["organization-by-uuid"], org_uuid)
	if err != nil {
		boom.Internal(w, err.Error())
		Log.Error("createOrganizationUser: " + err.Error())
		return
	}
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

	err = usernameExists(username)
	if err != nil {
		boom.BadData(w, err.Error())
		Log.Error("createOrganizationUser: " + err.Error())
		return
	}

	org_user := &OrgUser{}
	err = DB.postgre.Get(org_user, DB.QueriesRawMap["organization-user-by-username"], username)
	if err == nil && org_user.Index > 0 {
		msg := "there already exists a user with that username"
		boom.BadRequest(w, msg)
		Log.Error("createOrganizationUser: " + msg)
		return
	} else if err != nil && err != sql.ErrNoRows {
		boom.Internal(w, err.Error())
		Log.Error("createOrganizationUser: " + err.Error())
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

func createTeam(w http.ResponseWriter, r *http.Request) {
	r_upgraded := UpgradeRequest(r)

	api_key := r_upgraded.QueryOrDefault("api_key", "")
	if api_key != API_KEY {
		msg := "[api_key] missing or invalid"
		boom.Unathorized(w, msg)
		Log.Error("createTeam: " + msg)
		return
	}

	name := r_upgraded.QueryOrDefault("name", "")
	if len(name) < 3 {
		msg := "[name] missing or too short"
		boom.BadData(w, msg)
		Log.Error("createTeam: " + msg)
		return
	}

	uuid := _uuid.NewV4()
	now := time.Now().UTC()

	_, err := DB.Queries.Exec(DB.postgre, "create-team", uuid, name, now, now)
	if err != nil {
		boom.Internal(w, err.Error())
		Log.Error("createTeam: " + err.Error())
		return
	}

	w.Write([]byte("OK!"))
}

func createTeamUser(w http.ResponseWriter, r *http.Request) {
	r_upgraded := UpgradeRequest(r)

	api_key := r_upgraded.QueryOrDefault("api_key", "")
	if api_key != API_KEY {
		msg := "[api_key] missing or invalid"
		boom.Unathorized(w, msg)
		Log.Error("createTeamUser: " + msg)
		return
	}

	team_uuid_str := r_upgraded.QueryOrDefault("team_uuid", "")
	team_uuid := _uuid.FromStringOrNil(team_uuid_str)
	if team_uuid == _uuid.Nil {
		msg := "[team_uuid] missing or invalid"
		boom.BadData(w, msg)
		Log.Error("createTeamUser: " + msg)
		return
	}

	team := &Team{}
	err := DB.postgre.Get(team, DB.QueriesRawMap["team-by-uuid"], team_uuid)
	if err != nil {
		boom.Internal(w, err.Error())
		Log.Error("createTeamUser: " + err.Error())
		return
	}
	if !team.IsValid() {
		msg := "team is invalid"
		boom.Internal(w, msg)
		Log.Error("createTeamUser: " + msg)
		return
	}

	org_user_uuid_str := r_upgraded.QueryOrDefault("org_user_uuid", "")
	org_user_uuid := _uuid.FromStringOrNil(org_user_uuid_str)
	if org_user_uuid == _uuid.Nil {
		msg := "[org_user_uuid] missing or invalid"
		boom.BadData(w, msg)
		Log.Error("createTeamUser: " + msg)
		return
	}
	org_user := &OrgUser{}
	err = DB.postgre.Get(org_user, DB.QueriesRawMap["organization-user-by-uuid"], org_user_uuid)
	if err != nil {
		boom.Internal(w, err.Error())
		Log.Error("createTeamUser: " + err.Error())
		return
	}
	if !org_user.IsValid() {
		msg := "org user is invalid"
		boom.Internal(w, msg)
		Log.Error("createTeamUser: " + msg)
		return
	}

	err = userInTeam(org_user, team)
	if err != nil {
		boom.BadData(w, err.Error())
		Log.Error("createTeamUser: " + err.Error())
		return
	}

	uuid := _uuid.NewV4()
	now := time.Now().UTC()

	_, err = DB.Queries.Exec(DB.postgre, "create-team-user", uuid, team.Index, org_user.Index, now, now)
	if err != nil {
		boom.Internal(w, err.Error())
		Log.Error("createTeamUser: " + err.Error())
		return
	}

	w.Write([]byte("OK!"))
}

func loginUser(w http.ResponseWriter, r *http.Request) {
	r_upgraded := UpgradeRequest(r)
	login_state := LoginState{LoggedIn: false, Message: ""}

	username := r_upgraded.QueryOrDefault("username", "")
	if len(username) < 3 {
		login_state.Message = "[username] missing or too short"
		Log.Error("loginUser: " + login_state.Message)
		writeJSONResponse(w, login_state, http.StatusBadRequest)
		return
	}

	password := r_upgraded.QueryOrDefault("password", "")
	if len(password) < 3 {
		login_state.Message = "[password] missing or too short"
		Log.Error("loginUser: " + login_state.Message)
		writeJSONResponse(w, login_state, http.StatusBadRequest)
		return
	}

	user_uuid, err := authUser(username, password)
	if err != nil {
		login_state.Message = "Invalid user and/or password."
		Log.Error("loginUser: " + err.Error())
		writeJSONResponse(w, login_state, http.StatusBadRequest)
		return
	}

	session_token, err := CreateNewSession(r.Context(), user_uuid)
	if err != nil {
		login_state.Message = "Invalid user and/or password."
		Log.Error("loginUser: " + err.Error())
		writeJSONResponse(w, login_state, http.StatusBadRequest)
		return
	}

	session_token_cookie := &http.Cookie{Name: "session_token", Value: session_token, HttpOnly: true, Path: "/"}
	http.SetCookie(w, session_token_cookie)

	login_state.LoggedIn = true
	writeJSONResponse(w, login_state, http.StatusOK)
}

func logoutUser(w http.ResponseWriter, r *http.Request) {
	_, err := GetCurrentSession(r)
	if err != nil {
		boom.BadRequest(w, err)
		Log.Error("logoutUser: " + err.Error())
		return
	}

	sessionManager.Clear(r.Context())
	writeJSONResponse(w, map[string]interface{}{}, http.StatusOK)
}

func teamState(w http.ResponseWriter, r *http.Request) {
	r_upgraded := UpgradeRequest(r)

	team_uuid_str := r_upgraded.QueryOrDefault("team_uuid", "")
	team_uuid := _uuid.FromStringOrNil(team_uuid_str)
	if team_uuid == _uuid.Nil {
		msg := "[team_uuid] missing or invalid"
		boom.BadData(w, msg)
		Log.Error("teamState: " + msg)
		return
	}

	_, _, teams, _, err := apiUserState(r)
	if err != nil {
		boom.BadData(w, err.Error())
		Log.Error("teamState: " + err.Error())
		return
	}

	team := teams.hasTeam(team_uuid)
	if team == nil {
		msg := "no permission for team"
		boom.BadData(w, msg)
		Log.Error("teamState: " + msg)
		return
	}

	team_state, _ := teamStateForOrgUserTeam(team)
	writeJSONResponse(w, team_state, http.StatusOK)
}

func createProject(w http.ResponseWriter, r *http.Request) {
	r_upgraded := UpgradeRequest(r)

	req := CreateProjectReq{}
	if err := r_upgraded.ReadBodyJSON(&req); err != nil {
		boom.Internal(w, err.Error())
		Log.Error("createProject: " + err.Error())
		return
	}

	_, _, teams, _, err := apiUserState(r)
	if err != nil {
		boom.BadData(w, err.Error())
		Log.Error("createProject: " + err.Error())
		return
	}

	if len(req.TeamUuid) == 0 || len(req.Name) == 0 {
		msg := "bad request"
		boom.BadData(w, msg)
		Log.Error("createProject: " + msg)
		return
	}

	team := teams.hasTeam(_uuid.FromStringOrNil(req.TeamUuid))
	if team == nil {
		msg := "no permission for team"
		boom.BadData(w, msg)
		Log.Error("createProject: " + msg)
		return
	}

	project, err := createProjectFromReq(req)
	if err != nil {
		boom.BadData(w, err.Error())
		Log.Error("createProject: " + err.Error())
		return
	}

	writeJSONResponse(w, project, http.StatusOK)
}

func updateProject(w http.ResponseWriter, r *http.Request) {
	r_upgraded := UpgradeRequest(r)

	req := UpdateProjectReq{}
	if err := r_upgraded.ReadBodyJSON(&req); err != nil {
		boom.Internal(w, err.Error())
		Log.Error("updateProject: " + err.Error())
		return
	}

	_, _, teams, _, err := apiUserState(r)
	if err != nil {
		boom.BadData(w, err.Error())
		Log.Error("updateProject: " + err.Error())
		return
	}

	if len(req.TeamUuid) == 0 || len(req.Name) == 0 || len(req.ProjectUuid) == 0 {
		msg := "bad request"
		boom.BadData(w, msg)
		Log.Error("updateProject: " + msg)
		return
	}

	team := teams.hasTeam(_uuid.FromStringOrNil(req.TeamUuid))
	if team == nil {
		msg := "no permission for team"
		boom.BadData(w, msg)
		Log.Error("updateProject: " + msg)
		return
	}

	project, err := updateProjectFromReq(req)
	if err != nil {
		boom.BadData(w, err.Error())
		Log.Error("updateProject: " + err.Error())
		return
	}

	writeJSONResponse(w, project, http.StatusOK)
}

func deleteProject(w http.ResponseWriter, r *http.Request) {
	r_upgraded := UpgradeRequest(r)

	project_uuid := _uuid.FromStringOrNil(r_upgraded.QueryOrDefault("project-uuid", ""))
	if project_uuid == _uuid.Nil {
		msg := "[project_uuid] missing or invalid"
		boom.BadData(w, msg)
		Log.Error("deleteProject: " + msg)
		return
	}

	team_uuid := _uuid.FromStringOrNil(r_upgraded.QueryOrDefault("team-uuid", ""))
	if team_uuid == _uuid.Nil {
		msg := "[team_uuid] missing or invalid"
		boom.BadData(w, msg)
		Log.Error("deleteProject: " + msg)
		return
	}

	delete_tasks := r_upgraded.QueryBoolDefault("delete-tasks", false)

	_, _, teams, _, err := apiUserState(r)
	if err != nil {
		boom.BadData(w, err.Error())
		Log.Error("deleteProject: " + err.Error())
		return
	}

	team := teams.hasTeam(team_uuid)
	if team == nil {
		msg := "no permission for team"
		boom.BadData(w, msg)
		Log.Error("deleteProject: " + msg)
		return
	}

	err = delProject(project_uuid, team_uuid, delete_tasks)
	if err != nil {
		boom.BadData(w, err.Error())
		Log.Error("deleteProject: " + err.Error())
		return
	}

	writeJSONResponse(w, project_uuid, http.StatusOK)
}

func createTask(w http.ResponseWriter, r *http.Request) {
	r_upgraded := UpgradeRequest(r)

	req := CreateTaskReq{}
	if err := r_upgraded.ReadBodyJSON(&req); err != nil {
		boom.Internal(w, err.Error())
		Log.Error("createTask: " + err.Error())
		return
	}

	_, _, teams, _, err := apiUserState(r)
	if err != nil {
		boom.BadData(w, err.Error())
		Log.Error("createTask: " + err.Error())
		return
	}

	if len(req.TeamUuid) == 0 || len(req.Name) == 0 || req.State < 0 || req.State > 2 {
		msg := "bad request"
		boom.BadData(w, msg)
		Log.Error("createTask: " + msg)
		return
	}

	team := teams.hasTeam(_uuid.FromStringOrNil(req.TeamUuid))
	if team == nil {
		msg := "no permission for team"
		boom.BadData(w, msg)
		Log.Error("createTask: " + msg)
		return
	}

	task, project, err := createTaskFromReq(req)
	if err != nil {
		boom.BadData(w, err.Error())
		Log.Error("createTask: " + err.Error())
		return
	}

	writeJSONResponse(w, &TeamTaskForProject{Task: *task, Project: *project}, http.StatusOK)
}

func updateTask(w http.ResponseWriter, r *http.Request) {
	r_upgraded := UpgradeRequest(r)

	req := UpdateTaskReq{}
	if err := r_upgraded.ReadBodyJSON(&req); err != nil {
		boom.Internal(w, err.Error())
		Log.Error("updateTask: " + err.Error())
		return
	}

	_, _, teams, _, err := apiUserState(r)
	if err != nil {
		boom.BadData(w, err.Error())
		Log.Error("updateTask: " + err.Error())
		return
	}

	if len(req.TaskUuid) == 0 || len(req.TeamUuid) == 0 || len(req.Name) == 0 || req.State < 0 || req.State > 2 {
		msg := "bad request"
		boom.BadData(w, msg)
		Log.Error("updateTask: " + msg)
		return
	}

	team := teams.hasTeam(_uuid.FromStringOrNil(req.TeamUuid))
	if team == nil {
		msg := "no permission for team"
		boom.BadData(w, msg)
		Log.Error("updateTask: " + msg)
		return
	}

	task, err := updateTaskFromReq(req)
	if err != nil {
		boom.BadData(w, err.Error())
		Log.Error("updateTask: " + err.Error())
		return
	}

	writeJSONResponse(w, task, http.StatusOK)
}

func deleteTask(w http.ResponseWriter, r *http.Request) {
	r_upgraded := UpgradeRequest(r)

	task_uuid := _uuid.FromStringOrNil(r_upgraded.QueryOrDefault("task-uuid", ""))
	if task_uuid == _uuid.Nil {
		msg := "[task_uuid] missing or invalid"
		boom.BadData(w, msg)
		Log.Error("deleteTask: " + msg)
		return
	}

	team_uuid := _uuid.FromStringOrNil(r_upgraded.QueryOrDefault("team-uuid", ""))
	if team_uuid == _uuid.Nil {
		msg := "[team_uuid] missing or invalid"
		boom.BadData(w, msg)
		Log.Error("deleteTask: " + msg)
		return
	}

	_, _, teams, _, err := apiUserState(r)
	if err != nil {
		boom.BadData(w, err.Error())
		Log.Error("deleteTask: " + err.Error())
		return
	}

	team := teams.hasTeam(team_uuid)
	if team == nil {
		msg := "no permission for team"
		boom.BadData(w, msg)
		Log.Error("deleteTask: " + msg)
		return
	}

	err = delTask(task_uuid, team_uuid)
	if err != nil {
		boom.BadData(w, err.Error())
		Log.Error("deleteTask: " + err.Error())
		return
	}

	writeJSONResponse(w, task_uuid, http.StatusOK)
}

func writeJSONResponse(w http.ResponseWriter, data interface{}, status int) {
	json, err := json.Marshal(data)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		Log.Error("writeJSONResponse: " + err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(json)
}
