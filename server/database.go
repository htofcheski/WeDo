package main

import (
	"database/sql"
	"errors"
	"fmt"
	"net"
	"strings"
	"time"

	color "github.com/fatih/color"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
	"github.com/qustavo/dotsql"
	_uuid "github.com/satori/go.uuid"
)

const DriverName = "postgres"

func Version(db *sqlx.DB) string {
	return Variable(db, "server_version")
}

func Encoding(db *sqlx.DB) string {
	return Variable(db, "server_encoding")
}

func SSL(db *sqlx.DB) string {
	return Variable(db, "ssl")
}

func Variable(db *sqlx.DB, variableName string) string {
	if len(variableName) == 0 {
		return ""
	}
	value := ""
	if err := db.QueryRow(fmt.Sprintf("SHOW %q;", variableName)).Scan(&value); err != nil {
		Log.Errorf("postgre.Variable(%q): %s", variableName, err)
	}
	return value
}

func FormatDurationInSecondsSince(started time.Time) string {
	return fmt.Sprintf("%f seconds.", (time.Now().Sub(started)).Seconds())
}

func (do *DatabaseOptions) ConnectionStringDriver(no_password bool) string {
	host := do.Host
	host += ":5432"

	password := "****"
	if !no_password {
		password = do.Password
	}

	parts := []string{
		fmt.Sprintf("user=%s", do.Username),
		fmt.Sprintf("password=%s", password),
		fmt.Sprintf("dbname=%s", do.Database),
	}

	h, p, _ := net.SplitHostPort(host)
	parts = append(parts,
		fmt.Sprintf("host=%s", h),
		fmt.Sprintf("port=%s", p),
	)

	return strings.Join(parts, " ")
}

func Open(options *DatabaseOptions) (*sqlx.DB, error) {
	if options == nil {
		return nil, fmt.Errorf("%s: sql options is nil", DriverName)
	}

	// must
	for prop, value := range map[string]string{
		"Host":     options.Host,
		"Database": options.Database,
		"Username": options.Username,
		"Password": options.Password,
	} {
		if len(value) == 0 {
			return nil, fmt.Errorf("%s: options.%s is empty", DriverName, prop)
		}
	}

	var (
		db  *sqlx.DB
		err error
	)
	db, err = sqlx.Open(options.Driver, options.ConnectionStringDriver(false))
	if err != nil {
		return nil, fmt.Errorf("%s: %s open failed: %s", options.Driver, options.ConnectionStringDriver(true), err)
	}

	// apply post options
	if options.MaxOpenConnections > 0 {
		db.SetMaxOpenConns(options.MaxOpenConnections)
	}
	if options.MaxIdleConnections > 0 {
		db.SetMaxIdleConns(options.MaxIdleConnections)
	}
	if options.MaxLifetimeConnection > 0 {
		db.SetConnMaxLifetime(options.MaxLifetimeConnection)
	}
	if options.MaxIdleTimeConnection > 0 {
		db.SetConnMaxIdleTime(options.MaxIdleTimeConnection)
	}

	// ping check
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("%s: Failed to ping database server %s: %s", options.Driver, options.Host, err.Error())
	}

	return db, nil
}

func (db *Database) Initialize(options *DatabaseOptions) (err error) {
	db.Lock()
	defer db.Unlock()

	connStarted := time.Now()
	if db.postgre, err = Open(options); err != nil {
		return fmt.Errorf("DB connect error: %s", err.Error())
	}
	db.Version = Version(db.postgre)
	db.SSL = SSL(db.postgre)
	Log.Infof("Connected in %s - PostgreSQL v%s %s", FormatDurationInSecondsSince(connStarted), db.Version, db.SSL)

	dot, err := dotsql.LoadFromFile("./data/postgre/create-tables.sql")
	if err != nil {
		return fmt.Errorf("DB query from file error: %s", err.Error())
	}

	for _, create_table_query := range []string{
		"create-organization-table",
		"create-org-user-table",
		"create-team-table",
		"create-team-user-table",
		"create-task-table",
		"create-project-table",
	} {
		_, err := dot.Exec(db.postgre, create_table_query)
		if err != nil {
			return fmt.Errorf("DB query from file error: %s, query: %s", err.Error(), create_table_query)
		}
	}

	queries, err := dotsql.LoadFromFile("./data/postgre/queries.sql")
	if err != nil {
		return fmt.Errorf("DB query from file error: %s", err.Error())
	}
	db.Queries = queries
	db.QueriesRawMap = queries.QueryMap()

	return nil
}

func (db *Database) Close() error {
	if db.postgre == nil {
		return nil
	}
	return db.postgre.Close()
}

// Returns false on error
func (db *Database) CheckOperation(op string, err error, started time.Time) bool {
	spent := ""
	if !started.IsZero() {
		spent = FormatDurationInSecondsSince(started)
	}

	hasError := err != nil
	if hasError && !DatabaseNoResults(err) {
		// log error
		Log.Errorf(color.HiRedString("DB")+".%s error: %s (%s)", op, err.Error(), spent)
	}
	return hasError == false
}

// Rolls back transaction.
func (db *Database) Rollback(tx *sql.Tx) {
	if tx == nil {
		return
	}
	err := tx.Rollback()
	// already committed or rolled back
	if err == sql.ErrTxDone {
		err = nil
	}
	db.CheckOperation("Transaction.Rollback", err, time.Time{})
}

func DatabaseNoResults(err error) bool {
	return err == sql.ErrNoRows
}

func authUser(username string, password string) (_uuid.UUID, error) {
	org_user := &OrgUser{}
	err := DB.postgre.Get(org_user, DB.QueriesRawMap["organization-user-by-username"], username)
	if err != nil {
		return _uuid.Nil, err
	}
	if len(org_user.Password) == 0 {
		return _uuid.Nil, errors.New("internal problem")
	}

	if !CheckPasswordHash(password, org_user.Password) {
		return _uuid.Nil, errors.New("invalid user and/or password")
	}

	return org_user.Uuid, nil
}

func usernameExists(username string) error {
	org_user := &OrgUser{}
	err := DB.postgre.Get(org_user, DB.QueriesRawMap["organization-user-by-username"], username)
	if DatabaseNoResults(err) {
		return nil
	}
	if err != nil {
		return err
	}

	return errors.New("username already exists")
}

func userInTeam(user *OrgUser, team *Team) error {
	team_user := &TeamUser{}
	err := DB.postgre.Get(team_user, DB.QueriesRawMap["team-user-by-team-and-user"], team.Index, user.Index)
	if DatabaseNoResults(err) {
		return nil
	}
	if err != nil {
		return err
	}

	return errors.New("user is already on that team")
}

func teamsForOrgUser(org_user *OrgUser) (TeamList, TeamUserList, error) {
	teams_user := TeamUserList{}
	err := DB.postgre.Select(&teams_user, DB.QueriesRawMap["teams-user-by-user-index"], org_user.Index)
	if err != nil {
		Log.Error("teamsForOrgUser: " + err.Error())
		return TeamList{}, TeamUserList{}, err
	}

	if len(teams_user) > 0 {
		teams := TeamList{}
		in_query, args, err := sqlx.In(DB.QueriesRawMap["teams-for-org-user"], teams_user.TeamIndexes())
		if err != nil {
			Log.Error("teamsForOrgUser: " + err.Error())
			return TeamList{}, TeamUserList{}, err
		}
		err = DB.postgre.Select(&teams, DB.postgre.Rebind(in_query), args...)
		if err != nil {
			Log.Error("teamsForOrgUser: " + err.Error())
			return TeamList{}, TeamUserList{}, err
		}
		return teams, teams_user, nil
	}

	return TeamList{}, TeamUserList{}, nil
}

func organizationForOrgUser(org_user *OrgUser) (*Organization, error) {
	organization := &Organization{}
	err := DB.postgre.Get(organization, DB.QueriesRawMap["organization-by-index"], org_user.OrgIndex)
	if err != nil {
		Log.Error("organizationForOrgUser: " + err.Error())
		return &Organization{}, err
	}

	return organization, nil
}

func orgUserByUUID(user_uuid _uuid.UUID) (*OrgUser, error) {
	org_user := &OrgUser{}
	err := DB.postgre.Get(org_user, DB.QueriesRawMap["organization-user-by-uuid"], user_uuid)
	if err != nil {
		Log.Error("orgUserByUUID: " + err.Error())
		return &OrgUser{}, err
	}
	if !org_user.IsValid() {
		msg := "org user is invalid"
		Log.Error("orgUserByUUID: " + msg)
		return &OrgUser{}, errors.New(msg)
	}
	return org_user, nil
}

func orgUserByIndex(user_index uint64) (*OrgUser, error) {
	org_user := &OrgUser{}
	err := DB.postgre.Get(org_user, DB.QueriesRawMap["organization-user-by-index"], user_index)
	if err != nil {
		Log.Error("orgUserByIndex: " + err.Error())
		return &OrgUser{}, err
	}
	if !org_user.IsValid() {
		msg := "org user is invalid"
		Log.Error("orgUserByIndex: " + msg)
		return &OrgUser{}, errors.New(msg)
	}
	return org_user, nil
}

func teamStateForOrgUserTeam(team *Team) (TeamState, error) {
	team_state := TeamState{TeamUuid: team.Uuid}

	err := DB.postgre.Select(&team_state.TeamProjects, DB.QueriesRawMap["projects-by-team-index"], team.Index)
	if err != nil {
		Log.Error("teamStateForOrgUserTeam: " + err.Error())
		return TeamState{}, err
	}

	err = DB.postgre.Select(&team_state.TeamTasks, DB.QueriesRawMap["tasks-by-team-index"], team.Index)
	if err != nil {
		Log.Error("teamStateForOrgUserTeam: " + err.Error())
		return TeamState{}, err
	}

	err = DB.postgre.Select(&team_state.TeamUsers, DB.QueriesRawMap["team-users-by-team-index"], team.Index)
	if err != nil {
		Log.Error("teamStateForOrgUserTeam: " + err.Error())
		return TeamState{}, err
	}

	team_state.TeamToOrgUserMap = make(map[string]*OrgUser)
	for _, team_user := range team_state.TeamUsers {
		if _, ok := team_state.TeamToOrgUserMap[team_user.Uuid.String()]; !ok {
			org_user, err := orgUserByIndex(team_user.UserIndex)
			if err != nil {
				Log.Error("teamStateForOrgUserTeam: " + err.Error())
				return TeamState{}, err
			}
			team_state.TeamToOrgUserMap[team_user.Uuid.String()] = org_user
		}
	}

	return team_state, nil
}

func teamStatisticsForOrgUserTeam(team *Team) (TeamStatistics, error) {
	team_statistics := TeamStatistics{TeamUuid: team.Uuid}
	team_statistics.Period = make(map[string]*PeriodTaskCount)
	periods := []string{"previous_month", "previous_week", "previous_day", "day", "week", "month"}
	for _, period := range periods {
		begin, end := buildTimestampsFromPeriod(period)
		period_task_count := &PeriodTaskCount{}
		period_task_count.TeamUserCompletedTasksCount = make(map[string]int)
		team_tasks := TeamTaskList{}
		err := DB.postgre.Select(&team_tasks, DB.QueriesRawMap["completed-range-tasks-by-team-index"], team.Index, begin, end)
		if err != nil {
			return TeamStatistics{}, err
		}

		max_team_tasks_for_period := 0

		for _, team_task := range team_tasks {
			assigned_users_uuids := []string{}
			if len(team_task.AssignedUsersUuids) > 0 {
				assigned_users_uuids = strings.Split(team_task.AssignedUsersUuids, ",")
			}
			for _, assigned_user_uuid := range assigned_users_uuids {
				if count, ok := period_task_count.TeamUserCompletedTasksCount[assigned_user_uuid]; ok {
					period_task_count.TeamUserCompletedTasksCount[assigned_user_uuid] = count + 1
					if count+1 > max_team_tasks_for_period {
						period_task_count.TeamUserMvp = _uuid.FromStringOrNil(assigned_user_uuid)
						max_team_tasks_for_period = count + 1
					}
				} else {
					period_task_count.TeamUserCompletedTasksCount[assigned_user_uuid] = 1
					if 1 > max_team_tasks_for_period {
						period_task_count.TeamUserMvp = _uuid.FromStringOrNil(assigned_user_uuid)
						max_team_tasks_for_period = 1
					}
				}
			}
		}

		team_statistics.Period[period] = period_task_count
	}

	begin, end := buildTimestampsFromPeriod("year")
	team_tasks := TeamTaskList{}
	err := DB.postgre.Select(&team_tasks, DB.QueriesRawMap["range-tasks-by-team-index"], team.Index, begin, end)
	if err != nil {
		return TeamStatistics{}, err
	}
	year_team_user_completed_tasks_count := make(map[string]int)
	max_team_tasks_for_year := 0

	team_statistics.GoalTaskCount = make(map[string]*TaskCount)
	team_statistics.YearTaskCount = &TaskCount{Completed: 0, Left: 0}
	for _, team_task := range team_tasks {
		assigned_users_uuids := []string{}
		if len(team_task.AssignedUsersUuids) > 0 {
			assigned_users_uuids = strings.Split(team_task.AssignedUsersUuids, ",")
		}
		for _, assigned_user_uuid := range assigned_users_uuids {
			if count, ok := year_team_user_completed_tasks_count[assigned_user_uuid]; ok {
				year_team_user_completed_tasks_count[assigned_user_uuid] = count + 1
				if count+1 > max_team_tasks_for_year {
					team_statistics.YearTeamUserMvp = _uuid.FromStringOrNil(assigned_user_uuid)
					max_team_tasks_for_year = count + 1
				}
			} else {
				year_team_user_completed_tasks_count[assigned_user_uuid] = 1
				if 1 > max_team_tasks_for_year {
					team_statistics.YearTeamUserMvp = _uuid.FromStringOrNil(assigned_user_uuid)
					max_team_tasks_for_year = 1
				}
			}
		}

		if team_task.State == 2 {
			team_statistics.YearTaskCount.Completed += 1
			if len(team_task.Goal) > 0 {
				if _, ok := team_statistics.GoalTaskCount[team_task.Goal]; ok {
					team_statistics.GoalTaskCount[team_task.Goal].Completed += 1
				} else {
					team_statistics.GoalTaskCount[team_task.Goal] = &TaskCount{Completed: 1, Left: 0}
				}
			}
		} else {
			team_statistics.YearTaskCount.Left += 1
			if len(team_task.Goal) > 0 {
				if _, ok := team_statistics.GoalTaskCount[team_task.Goal]; ok {
					team_statistics.GoalTaskCount[team_task.Goal].Left += 1
				} else {
					team_statistics.GoalTaskCount[team_task.Goal] = &TaskCount{Completed: 0, Left: 1}
				}
			}
		}
	}

	return team_statistics, nil
}

func buildTimestampsFromPeriod(period string) (time.Time, time.Time) {
	now := time.Now().UTC()

	switch period {
	case "year":
		return now.AddDate(0, -12, 0), now
	case "previous_month":
		return now.AddDate(0, -2, 0), now.AddDate(0, -1, 0)
	case "previous_week":
		return now.AddDate(0, 0, -14), now.AddDate(0, 0, -7)
	case "previous_day":
		return now.AddDate(0, 0, -2), now.AddDate(0, 0, -1)
	case "day":
		return now.AddDate(0, 0, -1), now
	case "week":
		return now.AddDate(0, 0, -7), now
	case "month":
		return now.AddDate(0, -1, 0), now
	}

	return time.Time{}, time.Time{}
}

func createProjectFromReq(req CreateProjectReq) (*TeamProject, error) {
	team := &Team{}
	err := DB.postgre.Get(team, DB.QueriesRawMap["team-by-uuid"], _uuid.FromStringOrNil(req.TeamUuid))
	if err != nil {
		return &TeamProject{}, err
	}
	if !team.IsValid() {
		return &TeamProject{}, errors.New("team is invalid")
	}

	uuid := _uuid.NewV4()
	now := time.Now().UTC()
	tasks_uuids := ""
	if len(req.TasksUuids) > 0 {
		tasks_uuids = strings.Join(req.TasksUuids[:], ",")
	}

	_, err = DB.Queries.Exec(DB.postgre, "create-project", uuid, team.Index, tasks_uuids, req.Name, req.Description, now, now)
	if err != nil {
		return &TeamProject{}, err
	}

	project := &TeamProject{}
	err = DB.postgre.Get(project, DB.QueriesRawMap["project-by-uuid"], uuid, team.Index)
	if err != nil {
		return &TeamProject{}, err
	}

	return project, nil
}

func updateProjectFromReq(req UpdateProjectReq) (*TeamProject, error) {
	team := &Team{}
	err := DB.postgre.Get(team, DB.QueriesRawMap["team-by-uuid"], _uuid.FromStringOrNil(req.TeamUuid))
	if err != nil {
		return &TeamProject{}, err
	}
	if !team.IsValid() {
		return &TeamProject{}, errors.New("team is invalid")
	}

	uuid := _uuid.FromStringOrNil(req.ProjectUuid)
	now := time.Now().UTC()
	tasks_uuids := ""
	if len(req.TasksUuids) > 0 {
		tasks_uuids = strings.Join(req.TasksUuids[:], ",")
	}

	_, err = DB.Queries.Exec(DB.postgre, "update-project", tasks_uuids, req.Name, req.Description, now, uuid, team.Index)
	if err != nil {
		return &TeamProject{}, err
	}

	project := &TeamProject{}
	err = DB.postgre.Get(project, DB.QueriesRawMap["project-by-uuid"], uuid, team.Index)
	if err != nil {
		return &TeamProject{}, err
	}

	return project, nil
}

func delProject(project_uuid _uuid.UUID, team_uuid _uuid.UUID, delete_tasks bool) error {
	team := &Team{}
	err := DB.postgre.Get(team, DB.QueriesRawMap["team-by-uuid"], team_uuid)
	if err != nil {
		return err
	}
	if !team.IsValid() {
		return errors.New("team is invalid")
	}

	project := &TeamProject{}
	err = DB.postgre.Get(project, DB.QueriesRawMap["project-by-uuid"], project_uuid, team.Index)
	if err != nil {
		return err
	}

	task_uuids_str := []string{}
	if len(project.TasksUuids) > 0 {
		task_uuids_str = strings.Split(project.TasksUuids, ",")
	}

	tx := DB.postgre.MustBegin()
	now := time.Now().UTC()

	_, err = tx.Exec(DB.QueriesRawMap["delete-project"], now, project_uuid, team.Index)
	if err != nil {
		tx.Rollback()
		return err
	}

	if len(task_uuids_str) > 0 && delete_tasks {
		task_uuids := []_uuid.UUID{}
		for _, task_uuid_str := range task_uuids_str {
			task_uuids = append(task_uuids, _uuid.FromStringOrNil(task_uuid_str))
		}

		tasks := TeamTaskList{}
		in_query, args, err := sqlx.In(DB.QueriesRawMap["tasks-by-uuids"], task_uuids)
		if err != nil {
			tx.Rollback()
			return err
		}
		err = tx.Select(&tasks, tx.Rebind(in_query), args...)
		if err != nil {
			tx.Rollback()
			return err
		}

		if len(task_uuids) != len(tasks) {
			tx.Rollback()
			return errors.New("project has some invalid tasks")
		}
		for _, task := range tasks {
			if task.TeamIndex != team.Index {
				tx.Rollback()
				return errors.New("some tasks have a diff team than logged in user")
			}

			_, err = tx.Exec(DB.QueriesRawMap["delete-task"], now, task.Uuid, team.Index)
			if err != nil {
				tx.Rollback()
				return err
			}
		}
	}

	return tx.Commit()
}

func createTaskFromReq(req CreateTaskReq) (*TeamTask, *TeamProject, error) {
	tx := DB.postgre.MustBegin()
	team := &Team{}
	err := tx.Get(team, DB.QueriesRawMap["team-by-uuid"], _uuid.FromStringOrNil(req.TeamUuid))
	if err != nil {
		return &TeamTask{}, &TeamProject{}, err
	}
	if !team.IsValid() {
		return &TeamTask{}, &TeamProject{}, errors.New("team is invalid")
	}

	uuid := _uuid.NewV4()
	now := time.Now().UTC()
	assigned_users_uuids_str := ""
	assigned_users_uuids := []_uuid.UUID{}
	if len(req.AssignedUsersUuids) > 0 {
		assigned_users_uuids_str = strings.Join(req.AssignedUsersUuids[:], ",")

		for _, user_uuid := range req.AssignedUsersUuids {
			assigned_users_uuids = append(assigned_users_uuids, _uuid.FromStringOrNil(user_uuid))
		}
	}

	if len(assigned_users_uuids) > 0 {
		team_users := TeamUserList{}
		in_query, args, err := sqlx.In(DB.QueriesRawMap["teams-users-by-users-uuids"], assigned_users_uuids)
		if err != nil {
			return &TeamTask{}, &TeamProject{}, err
		}
		err = tx.Select(&team_users, tx.Rebind(in_query), args...)
		if err != nil {
			return &TeamTask{}, &TeamProject{}, err
		}

		if len(assigned_users_uuids) != len(team_users) {
			return &TeamTask{}, &TeamProject{}, errors.New("task has some invalid team users")
		}

		for _, team_user := range team_users {
			if team_user.TeamIndex != team.Index {
				return &TeamTask{}, &TeamProject{}, errors.New("some team users have a diff team than logged in user")
			}
		}
	}

	_, err = tx.Exec(DB.QueriesRawMap["create-task"], uuid, team.Index, assigned_users_uuids_str, req.Name, req.Description, req.Goal, now, now, now, req.State)
	if err != nil {
		return &TeamTask{}, &TeamProject{}, err
	}

	if len(req.ProjectUuid) > 0 {
		project := &TeamProject{}
		err = tx.Get(project, DB.QueriesRawMap["project-by-uuid"], _uuid.FromStringOrNil(req.ProjectUuid), team.Index)
		if err != nil {
			return &TeamTask{}, &TeamProject{}, err
		}

		tasks_uuids := []string{}
		tasks_uuids_str := ""
		if len(project.TasksUuids) > 0 {
			tasks_uuids = strings.Split(project.TasksUuids, ",")
		}
		tasks_uuids = append(tasks_uuids, uuid.String())
		tasks_uuids_str = strings.Join(tasks_uuids[:], ",")

		_, err = tx.Exec(DB.QueriesRawMap["update-project"], tasks_uuids_str, project.Name, project.Description, now, project.Uuid, team.Index)
		if err != nil {
			return &TeamTask{}, &TeamProject{}, err
		}
	}

	task := &TeamTask{}
	err = tx.Get(task, DB.QueriesRawMap["task-by-uuid"], uuid, team.Index)
	if err != nil {
		return &TeamTask{}, &TeamProject{}, err
	}

	project := &TeamProject{}
	if len(req.ProjectUuid) > 0 {
		err = tx.Get(project, DB.QueriesRawMap["project-by-uuid"], _uuid.FromStringOrNil(req.ProjectUuid), team.Index)
		if err != nil {
			return &TeamTask{}, &TeamProject{}, err
		}
	}

	err = tx.Commit()
	if err != nil {
		return &TeamTask{}, &TeamProject{}, err
	}

	return task, project, nil
}

func updateTaskFromReq(req UpdateTaskReq) (*TeamTask, error) {
	team := &Team{}
	err := DB.postgre.Get(team, DB.QueriesRawMap["team-by-uuid"], _uuid.FromStringOrNil(req.TeamUuid))
	if err != nil {
		return &TeamTask{}, err
	}
	if !team.IsValid() {
		return &TeamTask{}, errors.New("team is invalid")
	}

	now := time.Now().UTC()
	assigned_users_uuids_str := ""
	assigned_users_uuids := []_uuid.UUID{}
	if len(req.AssignedUsersUuids) > 0 {
		assigned_users_uuids_str = strings.Join(req.AssignedUsersUuids[:], ",")

		for _, user_uuid := range req.AssignedUsersUuids {
			assigned_users_uuids = append(assigned_users_uuids, _uuid.FromStringOrNil(user_uuid))
		}
	}

	if len(assigned_users_uuids) > 0 {
		team_users := TeamUserList{}
		in_query, args, err := sqlx.In(DB.QueriesRawMap["teams-users-by-users-uuids"], assigned_users_uuids)
		if err != nil {
			return &TeamTask{}, err
		}
		err = DB.postgre.Select(&team_users, DB.postgre.Rebind(in_query), args...)
		if err != nil {
			return &TeamTask{}, err
		}

		if len(assigned_users_uuids) != len(team_users) {
			return &TeamTask{}, errors.New("task has some invalid team users")
		}

		for _, team_user := range team_users {
			if team_user.TeamIndex != team.Index {
				return &TeamTask{}, errors.New("some team users have a diff team than logged in user")
			}
		}
	}
	task_before := &TeamTask{}
	err = DB.postgre.Get(task_before, DB.QueriesRawMap["task-by-uuid"], _uuid.FromStringOrNil(req.TaskUuid), team.Index)
	if err != nil {
		return &TeamTask{}, err
	}

	completed_timestamp := task_before.Completed
	if req.State != task_before.State && req.State == 2 {
		completed_timestamp = now
	}

	_, err = DB.postgre.Exec(DB.QueriesRawMap["update-task"], assigned_users_uuids_str, req.Name, req.Description, req.Goal, now, completed_timestamp, req.State, _uuid.FromStringOrNil(req.TaskUuid), team.Index)
	if err != nil {
		return &TeamTask{}, err
	}

	task_after := &TeamTask{}
	err = DB.postgre.Get(task_after, DB.QueriesRawMap["task-by-uuid"], _uuid.FromStringOrNil(req.TaskUuid), team.Index)
	if err != nil {
		return &TeamTask{}, err
	}

	return task_after, nil
}

func delTask(task_uuid _uuid.UUID, team_uuid _uuid.UUID) error {
	team := &Team{}
	err := DB.postgre.Get(team, DB.QueriesRawMap["team-by-uuid"], team_uuid)
	if err != nil {
		return err
	}
	if !team.IsValid() {
		return errors.New("team is invalid")
	}

	task := &TeamTask{}
	err = DB.postgre.Get(task, DB.QueriesRawMap["task-by-uuid"], task_uuid, team.Index)
	if err != nil {
		return err
	}

	now := time.Now().UTC()
	_, err = DB.postgre.Exec(DB.QueriesRawMap["delete-task"], now, task_uuid, team.Index)
	if err != nil {
		return err
	}

	return nil
}
