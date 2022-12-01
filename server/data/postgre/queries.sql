-- name: create-organization
INSERT INTO organization(uuid, name, created, updated) VALUES ($1, $2, $3, $4);

-- name: organization-by-uuid
SELECT index, uuid, name, created, updated, deleted_state FROM organization WHERE uuid = $1;

-- name: create-organization-user
INSERT INTO organization(uuid, name, created, updated) VALUES ($1, $2, $3, $4);