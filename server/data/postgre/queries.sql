-- name: create-organization
INSERT INTO organization(uuid, name, created, updated) VALUES ($1, $2, $3, $4);

-- name: organization-by-uuid
SELECT index, uuid, name, created, updated, deleted_state FROM organization WHERE uuid = $1;

-- name: create-organization-user
INSERT INTO org_user(uuid, org_index, username, password, email, description, profile_picture, created, updated) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);

-- name: organization-user-by-username
SELECT index, uuid, org_index, username, password, email, description, profile_picture, created, updated, deleted_state FROM org_user WHERE username = $1;