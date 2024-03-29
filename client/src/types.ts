export type Pages = 'projects' | 'statistics';

export interface Team {
  uuid: string;
  name: string;
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

export interface LoggedInUser extends OrgUser {
  team_user_uuid: string;
}

export interface TeamTask {
  uuid: string;
  assigned_users_uuids: string;
  name: string;
  description: string;
  goal: string;
  created: string;
  updated: string;
  completed: string;
  state: number;
}

export interface TeamTaskForProject {
  task: TeamTask;
  project: TeamProject;
}

export interface CreateTaskReq {
  project_uuid?: string;
  team_uuid: string;
  assigned_users_uuids?: string[];
  name: string;
  description?: string;
  goal?: string;
  state: number;
}

export interface UpdateTaskReq {
  task_uuid: string;
  team_uuid: string;
  assigned_users_uuids?: string[];
  name: string;
  description?: string;
  goal?: string;
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

export interface TeamState {
  team_uuid: string;
  team_users: TeamUser[];
  team_to_org_user_map: Map<string, OrgUser>;
  team_projects: TeamProject[];
  team_tasks: TeamTask[];
}

export interface PeriodTaskCount {
  team_user_mvp: string;
  team_user_completed_tasks_count: Map<string, number>;
}

export interface TaskCount {
  completed: number;
  left: number;
}

export interface TeamStatistics {
  team_uuid: string;
  period: Map<string, PeriodTaskCount>;
  goal_task_count: Map<string, TaskCount>;
  year_team_user_mvp: string;
  year_task_count: TaskCount;
}
