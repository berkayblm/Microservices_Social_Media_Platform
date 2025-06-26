/**
 * API Service for handling API requests
 */
const API = {
  BASE_URL: 'http://localhost:8080',

  // Authentication endpoints
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    CURRENT_USER: '/api/auth/current-user'
  },

  // Posts endpoints
  POSTS: {
    ALL: '/api/posts',
    BY_ID: (id) => `/api/posts/${id}`,
    BY_USER: (userId) => `/api/posts/user/${userId}`,
    LIKE: (postId) => `/api/posts/likes/post/${postId}`,
    LIKE_COUNT: (postId) => `/api/posts/likes/post/${postId}/count`
  },

  // Comments endpoints
  COMMENTS: {
    BY_POST: (postId) => `/api/posts/comments/post/${postId}`,
    BY_ID: (id) => `/api/posts/comments/${id}`
  },

  // Users endpoints
  USERS: {
    BY_ID: (id) => `/api/users/${id}`,
    BY_USERNAME: (username) => `/api/users/username/${username}`
  },

  // Profiles endpoints (newly added)
  PROFILES: {
    BY_ID: (userId) => `/api/profiles/${userId}`,
    BY_USERNAME: (username) => `/api/profiles/username/${username}`
  },

  // Headers utility function
  getHeaders: () => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  },

  // Helper method for handling responses
  handleResponse: async (response) => {
    if (!response.ok) {
      // Try to get error message from response
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      } catch (error) {
        throw new Error(`Request failed with status ${response.status}`);
      }
    }

    // Check if response has content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return null;
  },

  // Generic request method
  request: async (endpoint, method = 'GET', body = null) => {
    const url = API.BASE_URL + endpoint;
    const options = {
      method,
      headers: API.getHeaders()
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      return await API.handleResponse(response);
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  },

  // Authentication methods
  auth: {
    register: (userData) => API.request(API.AUTH.REGISTER, 'POST', userData),
    login: (credentials) => API.request(API.AUTH.LOGIN, 'POST', credentials),
    getCurrentUser: () => API.request(API.AUTH.CURRENT_USER)
  },

  // Posts methods
  posts: {
    getAll: (page = 0, size = 10) =>
      API.request(`${API.POSTS.ALL}?page=${page}&size=${size}`),

    getById: (id) =>
      API.request(API.POSTS.BY_ID(id)),

    getByUserId: (userId, page = 0, size = 10) =>
      API.request(`${API.POSTS.BY_USER(userId)}?page=${page}&size=${size}`),

    create: (postData) =>
      API.request(API.POSTS.ALL, 'POST', postData),

    update: (id, postData) =>
      API.request(API.POSTS.BY_ID(id), 'PUT', postData),

    delete: (id) =>
      API.request(API.POSTS.BY_ID(id), 'DELETE'),

    toggleLike: (postId, reactionType = 'LIKE') =>
      API.request(API.POSTS.LIKE(postId), 'POST', { reactionType }),

    getLikeCount: (postId) =>
      API.request(API.POSTS.LIKE_COUNT(postId))
  },

  // Comments methods
  comments: {
    getByPostId: (postId, page = 0, size = 10) =>
      API.request(`${API.COMMENTS.BY_POST(postId)}?page=${page}&size=${size}`),

    create: (postId, content) =>
      API.request(API.COMMENTS.BY_POST(postId), 'POST', { content }),

    update: (id, content) =>
      API.request(API.COMMENTS.BY_ID(id), 'PUT', { content }),

    delete: (id) =>
      API.request(API.COMMENTS.BY_ID(id), 'DELETE')
  },

  // Users methods
  users: {
    getById: (id) =>
      API.request(API.USERS.BY_ID(id)),

    getByUsername: (username) =>
      API.request(API.USERS.BY_USERNAME(username))
  },

  // Profiles methods (newly added)
  profiles: {
    getCurrentUserProfile: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API.BASE_URL}/api/profiles/me`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const text = await res.text();
      console.log('Raw /api/profiles/me response:', text);
      if (!res.ok) throw new Error('Failed to fetch current user profile');
      return JSON.parse(text);
    },
    updateCurrentUserProfile: async (profileData) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API.BASE_URL}/api/profiles/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(profileData)
      });
      if (!res.ok) throw new Error('Failed to update current user profile');
      return await res.json();
    },
    deleteCurrentUserProfile: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API.BASE_URL}/api/profiles/me`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Failed to delete current user profile');
      return true;
    },
    getByUserId: async (userId) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API.BASE_URL}${API.PROFILES.BY_ID(userId)}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Failed to fetch profile');
      return await res.json();
    },
    update: async (userId, profileData) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API.BASE_URL}${API.PROFILES.BY_ID(userId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(profileData)
      });
      if (!res.ok) throw new Error('Failed to update profile');
      return await res.json();
    }
  }
};
