CREATE TABLE IF NOT EXISTS organization (
  index bigserial PRIMARY KEY,
  uuid uuid NOT NULL UNIQUE,
  name text NOT NULL,
  created timestamp DEFAULT now(),
  updated timestamp DEFAULT now(),
  deleted_state smallint DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user (
  index bigserial PRIMARY KEY,
  uuid uuid NOT NULL UNIQUE,
  org_index bigint REFERENCES organization(index) ON DELETE RESTRICT,
  username text NOT NULL,
  password text NOT NULL,
  email text DEFAULT '',
  desc text DEFAULT '',
  profile_picture text DEFAULT '',
  created timestamp DEFAULT now(),
  updated timestamp DEFAULT now(),
  deleted_state smallint DEFAULT 0
);

CREATE TABLE IF NOT EXISTS team (
  index bigserial PRIMARY KEY,
  uuid uuid NOT NULL UNIQUE,
  name text NOT NULL,
  created timestamp DEFAULT now(),
  updated timestamp DEFAULT now(),
  deleted_state smallint DEFAULT 0
);

CREATE TABLE IF NOT EXISTS team_user (
  index bigserial PRIMARY KEY,
  uuid uuid NOT NULL UNIQUE,
  team_index bigint REFERENCES team(index) ON DELETE RESTRICT,
  user_index bigint REFERENCES user(index) ON DELETE RESTRICT,
  created timestamp DEFAULT now(),
  updated timestamp DEFAULT now(),
  deleted_state smallint DEFAULT 0
);

CREATE TABLE IF NOT EXISTS task (
  index bigserial PRIMARY KEY,
  uuid uuid NOT NULL UNIQUE,
  team_index bigint REFERENCES team(index) ON DELETE RESTRICT,
  assigned_users_uuids text DEFAULT '',  
  name text NOT NULL,
  desc text DEFAULT '',
  goal text DEFAULT '',
  created timestamp DEFAULT now(),
  updated timestamp DEFAULT now(),
  state smallint DEFAULT 0
  deleted_state smallint DEFAULT 0
);

CREATE TABLE IF NOT EXISTS project (
  index bigserial PRIMARY KEY,
  uuid uuid NOT NULL UNIQUE,
  team_index bigint REFERENCES team(index) ON DELETE RESTRICT,
  tasks_uuids text DEFAULT '',  
  name text NOT NULL,
  desc text DEFAULT '',
  created timestamp DEFAULT now(),
  updated timestamp DEFAULT now(),
  deleted_state smallint DEFAULT 0
);