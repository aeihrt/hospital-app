const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/hospital-app/hospital-app/backend';

export async function postJson(endpoint, payload) {
  const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
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
