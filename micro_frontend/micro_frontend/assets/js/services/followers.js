const API_BASE = 'http://localhost:8080';

const FollowersService = {
    // Helper to get auth headers
    getAuthHeaders: () => {
        const token = localStorage.getItem('token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    },

    // Follow a user
    followUser: async (followerId, followingId) => {
        try {
            const response = await fetch(`${API_BASE}/api/follows/${followerId}/follow/${followingId}`, {
                method: 'POST',
                headers: {
                    ...FollowersService.getAuthHeaders(),
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to follow user');
            return await response.json();
        } catch (error) {
            console.error('Error following user:', error);
            throw error;
        }
    },

    // Unfollow a user
    unfollowUser: async (followerId, followingId) => {
        try {
            const response = await fetch(`${API_BASE}/api/follows/${followerId}/unfollow/${followingId}`, {
                method: 'DELETE',
                headers: {
                    ...FollowersService.getAuthHeaders(),
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to unfollow user');
            return true;
        } catch (error) {
            console.error('Error unfollowing user:', error);
            throw error;
        }
    },

    // Get user's followers
    getFollowers: async (userId) => {
        try {
            const response = await fetch(`${API_BASE}/api/follows/${userId}/followers`, {
                headers: FollowersService.getAuthHeaders()
            });
            if (!response.ok) throw new Error('Failed to get followers');
            return await response.json();
        } catch (error) {
            console.error('Error getting followers:', error);
            throw error;
        }
    },

    // Get users being followed
    getFollowing: async (userId) => {
        try {
            const response = await fetch(`${API_BASE}/api/follows/${userId}/following`, {
                headers: FollowersService.getAuthHeaders()
            });
            if (!response.ok) throw new Error('Failed to get following');
            return await response.json();
        } catch (error) {
            console.error('Error getting following:', error);
            throw error;
        }
    },

    // Get follow counts
    getFollowCounts: async (userId) => {
        try {
            const response = await fetch(`${API_BASE}/api/follows/${userId}/counts`, {
                headers: FollowersService.getAuthHeaders()
            });
            if (!response.ok) throw new Error('Failed to get follow counts');
            return await response.json();
        } catch (error) {
            console.error('Error getting follow counts:', error);
            throw error;
        }
    },

    // Check if following
    isFollowing: async (followerId, followingId) => {
        try {
            const response = await fetch(`${API_BASE}/api/follows/${followerId}/is-following/${followingId}`, {
                headers: FollowersService.getAuthHeaders()
            });
            if (!response.ok) throw new Error('Failed to check following status');
            return await response.json();
        } catch (error) {
            console.error('Error checking following status:', error);
            throw error;
        }
    }
}; 