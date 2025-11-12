(() => {
  const API_BASE =
    window.__API_BASE__ ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  function ensureAbsolute(path) {
    if (path.startsWith('http')) return path;
    return `${API_BASE}${path}`;
  }

  function redirectToLogin(loginUrl) {
    const url = new URL(loginUrl || '/login', API_BASE);
    url.searchParams.set('redirect', encodeURIComponent(window.location.href));
    window.location.href = url.toString();
  }

  async function request(path, { method = 'GET', body, headers = {} } = {}) {
    const init = {
      method,
      credentials: 'include',
      headers: { ...headers },
    };

    if (body !== undefined) {
      init.body = JSON.stringify(body);
      init.headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(ensureAbsolute(path), init);

    let data = null;
    try {
      data = await response.json();
    } catch (err) {
      // ignore parsing errors for empty responses
    }

    if (response.status === 401) {
      redirectToLogin(data?.loginUrl);
      throw new Error('Redirecting to login');
    }

    if (!response.ok) {
      const message =
        (data && typeof data === 'object' && 'error' in data && data.error) ||
        response.statusText;
      throw new Error(message || 'Request failed');
    }

    return data;
  }

  const apiClient = {
    request,
    async getSession() {
      return request('/api/session');
    },
    async getProfile() {
      return request('/api/profile');
    },
    async updateProfile(profile) {
      return request('/api/profile', { method: 'PUT', body: profile });
    },
    async listContacts() {
      return request('/api/contacts');
    },
    async createContact(contact) {
      return request('/api/contacts', { method: 'POST', body: contact });
    },
    async updateContact(id, contact) {
      return request(`/api/contacts/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: contact,
      });
    },
    async deleteContact(id) {
      return request(`/api/contacts/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
    async logout() {
      return request('/logout', { method: 'POST', body: {} });
    },
  };

  window.apiClient = apiClient;
})();

