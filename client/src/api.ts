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
  teamState(team_uuid: string): Promise<any> {
    return fetch(`/api/v1/team-state${this.query({ team_uuid: team_uuid })}`, { headers: json_headers }).then(
      jsonResponse
    );
  },
};
