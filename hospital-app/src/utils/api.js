const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/hospital-app/hospital-app/backend';

async function requestJson(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = { success: false, message: 'Invalid server response' };
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export async function getJson(endpoint) {
  return requestJson(endpoint, { method: 'GET' });
}

export async function postJson(endpoint, payload) {
  return requestJson(endpoint, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
