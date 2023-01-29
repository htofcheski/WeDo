import {
  CreateProjectReq,
  CreateTaskReq,
  TeamProject,
  TeamState,
  TeamTask,
  TeamTaskForProject,
  UpdateProjectReq,
  UpdateTaskReq,
} from './types';

const json_headers = Object.assign(
  {},
  {},
  {
    'content-type': 'application/json',
  }
);

async function jsonResponse(resp: Response) {
  if (resp.ok) {
    return resp.json();
  }
  if ((resp.headers.get('content-type') || '').startsWith('application/json')) {
    const data = await resp.json();
    throw data;
  }
  throw `${resp.status} ${resp.statusText} - ${resp.url}`;
}

export interface APIResponse {
  error: string;
  details?: any;
}

export const api = {
  /**
   *
   * @param query
   * @return string
   */
  query(query: any): string {
    if (!query || typeof query !== 'object') {
      return '';
    }
    var serializesd = new URLSearchParams(query).toString();
    return serializesd ? '?' + serializesd : '';
  },
  logout() {
    return fetch(`/api/v1/logout`, {
      method: 'GET',
      headers: json_headers,
    }).then(jsonResponse);
  },
  teamState(team_uuid: string): Promise<TeamState> {
    return fetch(`/api/v1/team-state${this.query({ team_uuid: team_uuid })}`, { headers: json_headers }).then(
      jsonResponse
    );
  },
  createProject(req: CreateProjectReq): Promise<TeamProject> {
    return fetch('/api/v1/create-project', {
      headers: json_headers,
      method: 'POST',
      body: JSON.stringify(req),
    }).then(jsonResponse);
  },
  updateProject(req: UpdateProjectReq): Promise<TeamProject> {
    return fetch('/api/v1/update-project', {
      headers: json_headers,
      method: 'POST',
      body: JSON.stringify(req),
    }).then(jsonResponse);
  },
  deleteProject(project_uuid: string, team_uuid: string, delete_project_tasks: boolean): Promise<string> {
    return fetch(
      `/api/v1/delete-project?project-uuid=${project_uuid}&team-uuid=${team_uuid}&delete-tasks=${delete_project_tasks}`,
      {
        headers: json_headers,
        method: 'POST',
      }
    ).then(jsonResponse);
  },
  createTask(req: CreateTaskReq): Promise<TeamTaskForProject> {
    return fetch('/api/v1/create-task', {
      headers: json_headers,
      method: 'POST',
      body: JSON.stringify(req),
    }).then(jsonResponse);
  },
  updateTask(req: UpdateTaskReq): Promise<TeamTask> {
    return fetch('/api/v1/update-task', {
      headers: json_headers,
      method: 'POST',
      body: JSON.stringify(req),
    }).then(jsonResponse);
  },
  deleteTask(task_uuid: string, team_uuid: string): Promise<string> {
    return fetch(`/api/v1/delete-task?task-uuid=${task_uuid}&team-uuid=${team_uuid}`, {
      headers: json_headers,
      method: 'POST',
    }).then(jsonResponse);
  },

  updateTasksState(task_uuid: string, state: number): Promise<any> {
    return fetch(`/api/v1/update-tasks-state?task-uuid=${task_uuid}&new-state=${state.toString()}`, {
      headers: json_headers,
      method: 'POST',
    }).then(jsonResponse);
  },
};
