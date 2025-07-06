/**
 * Authentication Service
 */
const AuthService = {
  // Check if user is logged in
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Get current user info
  getCurrentUser: () => {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  },

  // Set authentication data
  setAuth: (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({
      id: data.id,
      username: data.username
    }));
  },

  // Clear authentication data
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Register new user
  register: async (userData) => {
    try {
      const response = await API.auth.register(userData);
      if (response && response.token) {
        AuthService.setAuth(response);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await API.auth.login(credentials);
      if (response && response.token) {
        AuthService.setAuth(response);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Logout user
  logout: () => {
    AuthService.clearAuth();
    window.location.href = 'login.html';
  }
};

// Run on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication status based on current page
  const currentPath = window.location.pathname;
  const publicPages = ['/login.html', '/signup.html', '/index.html'];
  const isPublicPage = publicPages.some(page => currentPath.endsWith(page));

  if (!isPublicPage && !AuthService.isAuthenticated()) {
    // Redirect to login if accessing protected page without auth
    window.location.href = 'login.html';
    return;
  } else if (isPublicPage && AuthService.isAuthenticated()) {
    // Redirect to feed if accessing public page with auth
    window.location.href = 'feed.html';
    return;
  }

  // Handle login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Get form data
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      // UI updates
      const loginButton = document.getElementById('loginButton');
      const loginSpinner = document.getElementById('loginSpinner');
      const loginText = document.getElementById('loginText');
      const errorAlert = document.getElementById('loginErrorAlert');

      loginButton.disabled = true;
      loginSpinner.classList.remove('d-none');
      loginText.textContent = 'Logging in...';
      errorAlert.classList.add('d-none');

      try {
        // Attempt login
        const success = await AuthService.login({ username, password });
        if (success) {
          window.location.href = 'feed.html';
        } else {
          errorAlert.textContent = 'Login failed. Please check your credentials.';
          errorAlert.classList.remove('d-none');
        }
      } catch (error) {
        errorAlert.textContent = error.message || 'Login failed. Please try again.';
        errorAlert.classList.remove('d-none');
      } finally {
        loginButton.disabled = false;
        loginSpinner.classList.add('d-none');
        loginText.textContent = 'Log In';
      }
    });
  }

  // Handle register form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Get form data
      const firstName = document.getElementById('firstName').value;
      const lastName = document.getElementById('lastName').value;
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      // Validate passwords match
      if (password !== confirmPassword) {
        const errorAlert = document.getElementById('registerErrorAlert');
        errorAlert.textContent = 'Passwords do not match';
        errorAlert.classList.remove('d-none');
        return;
      }

      // UI updates
      const registerButton = document.getElementById('registerButton');
      const registerSpinner = document.getElementById('registerSpinner');
      const registerText = document.getElementById('registerText');
      const errorAlert = document.getElementById('registerErrorAlert');

      registerButton.disabled = true;
      registerSpinner.classList.remove('d-none');
      registerText.textContent = 'Creating account...';
      errorAlert.classList.add('d-none');

      try {
        // Attempt registration
        const success = await AuthService.register({
          firstName,
          lastName,
          username,
          email,
          password
        });

        if (success) {
          window.location.href = 'feed.html';
        } else {
          errorAlert.textContent = 'Registration failed. Please try again.';
          errorAlert.classList.remove('d-none');
        }
      } catch (error) {
        errorAlert.textContent = error.message || 'Registration failed. Please try again.';
        errorAlert.classList.remove('d-none');
      } finally {
        registerButton.disabled = false;
        registerSpinner.classList.add('d-none');
        registerText.textContent = 'Create Account';
      }
    });
  }

  // Handle logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      AuthService.logout();
    });
  }

  // Update UI with current user info
  const currentUsername = document.getElementById('currentUsername');
  const sidebarUsername = document.getElementById('sidebarUsername');
  const sidebarFullName = document.getElementById('sidebarFullName');

  if (AuthService.isAuthenticated()) {
    const user = AuthService.getCurrentUser();
    
    // Update navigation username with display name from profile
    if (currentUsername) {
      // Try to get profile data for display name, fallback to username
      try {
        const profile = await API.profiles.getCurrentUserProfile();
        currentUsername.textContent = profile.displayName || user.username;
      } catch (error) {
        console.error('Error fetching profile for navigation:', error);
        currentUsername.textContent = user.username;
      }
    }

    // Sidebar will be updated by feed.js, so we don't need to set it here
  }
});
