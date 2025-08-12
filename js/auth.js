/**
 * Authentication Management
 * Handles login, registration, and authentication state
 */

class AuthManager {
  constructor() {
    this.api = window.skillUpAPI;
    this.init();
  }

  init() {
    // Check authentication status on page load
    this.updateUIBasedOnAuth();
    
    // Set up event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    // Registration form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    }

    // Logout buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('logout-btn')) {
        this.handleLogout();
      }
    });
  }

  async handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const username = formData.get('username');
    const password = formData.get('password');

    if (!username || !password) {
      this.showMessage('Please fill in all fields', 'error');
      return;
    }

    this.showLoading(true);

    try {
      const response = await this.api.login(username, password);
      
      if (response.success) {
        this.showMessage('Login successful!', 'success');
        this.updateUIBasedOnAuth();
        
        // Redirect based on user role
        const user = this.api.getUser();
        this.redirectAfterLogin(user.role);
      } else {
        this.showMessage(response.message || 'Login failed', 'error');
      }
    } catch (error) {
      this.showMessage('Login failed. Please try again.', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  async handleRegister(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const userData = {
      username: formData.get('username'),
      email: formData.get('email'),
      password: formData.get('password'),
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      role: formData.get('role') || 'student'
    };

    // Basic validation
    if (!userData.username || !userData.email || !userData.password) {
      this.showMessage('Please fill in all required fields', 'error');
      return;
    }

    if (userData.password.length < 8) {
      this.showMessage('Password must be at least 8 characters long', 'error');
      return;
    }

    this.showLoading(true);

    try {
      const response = await this.api.register(userData);
      
      if (response.success) {
        this.showMessage('Registration successful!', 'success');
        this.updateUIBasedOnAuth();
        
        // Redirect based on user role
        const user = this.api.getUser();
        this.redirectAfterLogin(user.role);
      } else {
        this.showMessage(response.message || 'Registration failed', 'error');
      }
    } catch (error) {
      this.showMessage('Registration failed. Please try again.', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  async handleLogout() {
    try {
      await this.api.logout();
      this.showMessage('Logged out successfully', 'success');
      this.updateUIBasedOnAuth();
      
      // Redirect to home page
      window.location.href = 'index.html';
    } catch (error) {
      console.error('Logout error:', error);
      // Clear tokens anyway
      this.api.clearTokens();
      this.updateUIBasedOnAuth();
      window.location.href = 'index.html';
    }
  }

  updateUIBasedOnAuth() {
    const isAuthenticated = this.api.isAuthenticated();
    const user = this.api.getUser();

    // Update navigation
    const authButtons = document.querySelectorAll('.auth-required');
    const guestButtons = document.querySelectorAll('.guest-only');
    const userInfo = document.querySelectorAll('.user-info');

    authButtons.forEach(btn => {
      btn.style.display = isAuthenticated ? 'block' : 'none';
    });

    guestButtons.forEach(btn => {
      btn.style.display = isAuthenticated ? 'none' : 'block';
    });

    if (isAuthenticated && user) {
      userInfo.forEach(info => {
        info.textContent = `Welcome, ${user.firstName || user.username}!`;
        info.style.display = 'block';
      });

      // Update role-specific elements
      this.updateRoleBasedUI(user.role);
    } else {
      userInfo.forEach(info => {
        info.style.display = 'none';
      });
    }
  }

  updateRoleBasedUI(role) {
    // Show/hide elements based on user role
    const adminElements = document.querySelectorAll('.admin-only');
    const teacherElements = document.querySelectorAll('.teacher-only');
    const studentElements = document.querySelectorAll('.student-only');

    adminElements.forEach(el => {
      el.style.display = role === 'admin' ? 'block' : 'none';
    });

    teacherElements.forEach(el => {
      el.style.display = ['admin', 'teacher'].includes(role) ? 'block' : 'none';
    });

    studentElements.forEach(el => {
      el.style.display = role === 'student' ? 'block' : 'none';
    });
  }

  redirectAfterLogin(role) {
    // Redirect based on user role
    setTimeout(() => {
      switch (role) {
        case 'admin':
          window.location.href = 'admin-dashboard.html';
          break;
        case 'teacher':
          window.location.href = 'teacher-dashboard.html';
          break;
        case 'student':
          window.location.href = 'student-dashboard.html';
          break;
        default:
          window.location.href = 'index.html';
      }
    }, 1500);
  }

  showMessage(message, type = 'info') {
    // Create or update message element
    let messageEl = document.getElementById('auth-message');
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.id = 'auth-message';
      messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        max-width: 300px;
      `;
      document.body.appendChild(messageEl);
    }

    // Set message and style based on type
    messageEl.textContent = message;
    messageEl.className = `message-${type}`;
    
    switch (type) {
      case 'success':
        messageEl.style.backgroundColor = '#4CAF50';
        break;
      case 'error':
        messageEl.style.backgroundColor = '#f44336';
        break;
      default:
        messageEl.style.backgroundColor = '#2196F3';
    }

    messageEl.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
      messageEl.style.display = 'none';
    }, 5000);
  }

  showLoading(show) {
    const loadingElements = document.querySelectorAll('.loading-spinner');
    const submitButtons = document.querySelectorAll('button[type="submit"]');

    loadingElements.forEach(el => {
      el.style.display = show ? 'block' : 'none';
    });

    submitButtons.forEach(btn => {
      btn.disabled = show;
      btn.textContent = show ? 'Loading...' : btn.dataset.originalText || btn.textContent;
      if (!btn.dataset.originalText) {
        btn.dataset.originalText = btn.textContent;
      }
    });
  }

  // Utility method to protect pages that require authentication
  requireAuth(requiredRole = null) {
    if (!this.api.isAuthenticated()) {
      this.showMessage('Please log in to access this page', 'error');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
      return false;
    }

    if (requiredRole) {
      const userRole = this.api.getUserRole();
      const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      
      if (!allowedRoles.includes(userRole) && userRole !== 'admin') {
        this.showMessage('You do not have permission to access this page', 'error');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 2000);
        return false;
      }
    }

    return true;
  }
}

// Initialize authentication manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.authManager = new AuthManager();
});
