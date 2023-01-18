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

export interface CreateTaskReq {
  team_uuid: string;
  assigned_users_uuids?: string[];
  name: string;
  description?: string;
  goal?: string;
}
