export function buildHttpActionRequestBody(body: unknown) {
  if (body === undefined || body === null || body === '') {
    return undefined;
  }

  if (typeof body === 'string') {
    return body;
  }

  return JSON.stringify(body);
}

export function buildHttpActionRequestHeaders(headers: Record<string, string> | undefined, body: unknown) {
  if (body === undefined || body === null || body === '' || typeof body === 'string') {
    return headers;
  }

  return {
    'content-type': 'application/json',
    ...headers,
  };
}
