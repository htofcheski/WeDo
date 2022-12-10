const json_post_headers = Object.assign(
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

function query(query: any, skip_empty: boolean = false): string {
  if (!query || typeof query !== 'object') {
    return '';
  }
  if (skip_empty) {
    Object.keys(query).forEach((key) => {
      if (query[key] === '') delete query[key];
    });
  }
  var serializesd = new URLSearchParams(query).toString();
  return serializesd ? '?' + serializesd : '';
}

export interface APIResponse {
  error: string;
  details?: any;
}

export const api = {
  logout() {
    return fetch(`/api/v1/logout`, {
      method: 'GET',
      headers: json_post_headers,
    }).then(jsonResponse);
  },
};
