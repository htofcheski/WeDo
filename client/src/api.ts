import { CreateProjectReq, CreateTaskReq, TeamState, UpdateProjectReq } from './types';

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
  createProject(req: CreateProjectReq): Promise<any> {
    return fetch('/api/v1/create-project', {
      headers: json_headers,
      method: 'POST',
      body: JSON.stringify(req),
    }).then(jsonResponse);
  },
  updateProject(req: UpdateProjectReq): Promise<any> {
    return fetch('/api/v1/update-project', {
      headers: json_headers,
      method: 'POST',
      body: JSON.stringify(req),
    }).then(jsonResponse);
  },

  createTask(req: CreateTaskReq): Promise<any> {
    return fetch('/api/v1/create-task', {
      headers: json_headers,
      method: 'POST',
      body: JSON.stringify(req),
    }).then(jsonResponse);
  },
};
