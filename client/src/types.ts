export type Pages = 'projects' | 'statistics';

export interface Team {
  uuid: string;
  name: string;
  created: string;
  updated: string;
}

export interface CreateProjectReq {
  team_uuid: string;
  tasks_uuids?: string[];
  name: string;
  description?: string;
}

export interface UpdateProjectReq {
  project_uuid: string;
  team_uuid: string;
  tasks_uuids?: string[];
  name: string;
  description?: string;
}

export interface CreateTaskReq {
  team_uuid: string;
  assigned_users_uuids?: string[];
  name: string;
  description?: string;
  goal?: string;
}

export interface TeamTask {
  uuid: string;
  assigned_users_uuids: string;
  name: string;
  description: string;
  goal: string;
  created: string;
  updated: string;
  state: number;
}

export interface TeamProject {
  uuid: string;
  tasks_uuids: string;
  name: string;
  description: string;
  created: string;
  updated: string;
}

export interface TeamUser {
  uuid: string;
  created: string;
  updated: string;
}

export interface OrgUser {
  uuid: string;
  username: string;
  email: string;
  description: string;
  profile_picture: string;
  created: string;
  updated: string;
}

export interface TeamState {
  team_uuid: string;
  team_users: TeamUser[];
  team_to_org_user_map: Map<string, OrgUser>;
  team_projects: TeamProject[];
  team_tasks: TeamTask[];
}

export interface LoggedInUser extends OrgUser {
  team_user_uuid: string;
}
