-- name: create-organization
INSERT INTO organization(uuid, name, created, updated) VALUES ($1, $2, $3, $4);

-- name: organization-by-uuid
SELECT index, uuid, name, created, updated, deleted_state FROM organization WHERE uuid = $1 AND deleted_state = 0;

-- name: organization-by-index
SELECT index, uuid, name, created, updated, deleted_state FROM organization WHERE index = $1 AND deleted_state = 0;

-- name: create-team
INSERT INTO team(uuid, name, created, updated) VALUES ($1, $2, $3, $4);

-- name: team-by-uuid
SELECT index, uuid, name, created, updated, deleted_state FROM team WHERE uuid = $1 AND deleted_state = 0;

-- name: teams-for-org-user
SELECT index, uuid, name, created, updated, deleted_state FROM team WHERE index IN (?) AND deleted_state = 0;

-- name: create-team-user
INSERT INTO team_user(uuid, team_index, user_index, created, updated) VALUES ($1, $2, $3, $4, $5);

-- name: team-user-by-team-and-user
SELECT index, uuid, team_index, user_index, created, updated, deleted_state FROM team_user WHERE team_index = $1 AND user_index = $2 AND deleted_state = 0;

-- name: teams-user-by-user-index
SELECT index, uuid, team_index, user_index, created, updated, deleted_state FROM team_user WHERE user_index = $1 AND deleted_state = 0;

-- name: team-users-by-team-index
SELECT index, uuid, team_index, user_index, created, updated, deleted_state FROM team_user WHERE team_index = $1 AND deleted_state = 0;

-- name: create-organization-user
INSERT INTO org_user(uuid, org_index, username, password, email, description, profile_picture, created, updated) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);

-- name: organization-user-by-username
SELECT index, uuid, org_index, username, password, email, description, profile_picture, created, updated, deleted_state FROM org_user WHERE username = $1 AND deleted_state = 0;

-- name: organization-user-by-uuid
SELECT index, uuid, org_index, username, password, email, description, profile_picture, created, updated, deleted_state FROM org_user WHERE uuid = $1 AND deleted_state = 0;

-- name: organization-user-by-index
SELECT index, uuid, org_index, username, password, email, description, profile_picture, created, updated, deleted_state FROM org_user WHERE index = $1 AND deleted_state = 0;

-- name: projects-by-team-index
SELECT index, uuid, team_index, tasks_uuids, name, description, created, updated, deleted_state FROM project WHERE team_index = $1 AND deleted_state = 0;

-- name: tasks-by-team-index
SELECT index, uuid, team_index, assigned_users_uuids, name, description, goal, created, updated, state, deleted_state FROM task WHERE team_index = $1 AND deleted_state = 0;

-- name: create-project
INSERT INTO project(uuid, team_index, tasks_uuids, name, description, created, updated) VALUES ($1, $2, $3, $4, $5, $6, $7);

-- name: update-project
UPDATE project SET tasks_uuids = $1, name = $2, description = $3, updated = $4 WHERE uuid = $5 AND team_index = $6;

-- name: create-task
INSERT INTO task(uuid, team_index, assigned_users_uuids, name, description, goal, created, updated, state) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);