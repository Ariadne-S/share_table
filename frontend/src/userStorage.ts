/**
 * Client-side user identity for audit tracking. No authentication - we generate a UUID and
 * optionally store a display name. Sent as X-User-Id and X-User-Name headers.
 */
const STORAGE_USER_ID = 'sharetable_user_id';
const STORAGE_USER_NAME = 'sharetable_user_name';

export function getUserId(): string {
  let id = localStorage.getItem(STORAGE_USER_ID);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_USER_ID, id);
  }
  return id;
}

export function getUserName(): string | null {
  return localStorage.getItem(STORAGE_USER_NAME);
}

export function setUserName(name: string | null): void {
  if (name?.trim()) {
    localStorage.setItem(STORAGE_USER_NAME, name.trim());
  } else {
    localStorage.removeItem(STORAGE_USER_NAME);
  }
}

export function getUserHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const id = getUserId();
  const name = getUserName();
  headers['X-User-Id'] = id;
  if (name) {
    headers['X-User-Name'] = name;
  }
  return headers;
}
