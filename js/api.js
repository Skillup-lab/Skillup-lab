/**
 * API Integration Layer
 * Handles all API calls to the backend
 */

class SkillUpAPI {
  constructor() {
    this.baseURL = 'http://localhost:3000/api';
    this.token = localStorage.getItem('skillup_token');
    this.refreshToken = localStorage.getItem('skillup_refresh_token');
  }

  /**
   * Make HTTP request with authentication
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Add auth token if available
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      // Handle token expiration
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry original request with new token
          config.headers.Authorization = `Bearer ${this.token}`;
          const retryResponse = await fetch(url, config);
          return await retryResponse.json();
        }
      }

      return { ...data, status: response.status };
    } catch (error) {
      console.error('API Request failed:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
        status: 0
      };
    }
  }

  /**
   * Authentication Methods
   */
  async login(username, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    if (response.success) {
      this.setTokens(response.data.tokens);
      this.setUser(response.data.user);
    }

    return response;
  }

  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    if (response.success) {
      this.setTokens(response.data.tokens);
      this.setUser(response.data.user);
    }

    return response;
  }

  async logout() {
    const response = await this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: this.refreshToken })
    });

    this.clearTokens();
    return response;
  }

  async refreshAccessToken() {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      const data = await response.json();

      if (data.success) {
        this.setTokens(data.data.tokens);
        return true;
      } else {
        this.clearTokens();
        return false;
      }
    } catch (error) {
      this.clearTokens();
      return false;
    }
  }

  async getProfile() {
    return await this.request('/auth/profile');
  }

  async updateProfile(profileData) {
    return await this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  /**
   * Forms Methods
   */
  async getForms(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/forms${queryString ? `?${queryString}` : ''}`;
    return await this.request(endpoint);
  }

  async getForm(formId) {
    return await this.request(`/forms/${formId}`);
  }

  async createForm(formData) {
    return await this.request('/forms', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
  }

  async updateForm(formId, formData) {
    return await this.request(`/forms/${formId}`, {
      method: 'PUT',
      body: JSON.stringify(formData)
    });
  }

  async deleteForm(formId) {
    return await this.request(`/forms/${formId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Submissions Methods
   */
  async getSubmissions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/submissions${queryString ? `?${queryString}` : ''}`;
    return await this.request(endpoint);
  }

  async submitForm(formId, submissionData) {
    return await this.request(`/submissions/form/${formId}`, {
      method: 'POST',
      body: JSON.stringify({ submissionData })
    });
  }

  async getSubmission(submissionId) {
    return await this.request(`/submissions/${submissionId}`);
  }

  async updateSubmission(submissionId, updateData) {
    return await this.request(`/submissions/${submissionId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  /**
   * User Management (Admin only)
   */
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/users${queryString ? `?${queryString}` : ''}`;
    return await this.request(endpoint);
  }

  async createUser(userData) {
    return await this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  /**
   * Token Management
   */
  setTokens(tokens) {
    this.token = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    localStorage.setItem('skillup_token', this.token);
    localStorage.setItem('skillup_refresh_token', this.refreshToken);
  }

  setUser(user) {
    localStorage.setItem('skillup_user', JSON.stringify(user));
  }

  getUser() {
    const user = localStorage.getItem('skillup_user');
    return user ? JSON.parse(user) : null;
  }

  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('skillup_token');
    localStorage.removeItem('skillup_refresh_token');
    localStorage.removeItem('skillup_user');
  }

  isAuthenticated() {
    return !!this.token;
  }

  getUserRole() {
    const user = this.getUser();
    return user ? user.role : null;
  }
}

// Create global API instance
window.skillUpAPI = new SkillUpAPI();
