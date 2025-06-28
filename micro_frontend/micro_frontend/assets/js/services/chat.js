const API_BASE = 'http://localhost:8080';

const ChatService = {
    // Helper to get auth headers
    getAuthHeaders: () => {
        const token = localStorage.getItem('token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    },

    // Get current user's following list for chat selection
    getFollowingForChat: async () => {
        try {
            const currentUser = AuthService.getCurrentUser();
            if (!currentUser) throw new Error('No current user found');

            console.log('Getting following for user:', currentUser.id);
            const response = await fetch(`${API_BASE}/api/follows/${currentUser.id}/following`, {
                headers: ChatService.getAuthHeaders()
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Following API error:', response.status, errorText);
                
                if (response.status === 429) {
                    throw new Error('Rate limited: Too many requests. Please wait a moment.');
                }
                throw new Error(`Failed to get following list: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Following data:', data);
            return data;
        } catch (error) {
            console.error('Error getting following for chat:', error);
            throw error;
        }
    },

    // Get conversation partners (users with existing conversations)
    getConversationPartners: async () => {
        try {
            console.log('Getting conversation partners');
            const response = await fetch(`${API_BASE}/api/messages/inbox`, {
                headers: ChatService.getAuthHeaders()
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Inbox API error:', response.status, errorText);
                
                if (response.status === 429) {
                    throw new Error('Rate limited: Too many requests. Please wait a moment.');
                }
                throw new Error(`Failed to get conversation partners: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Conversation partners:', data);
            return data;
        } catch (error) {
            console.error('Error getting conversation partners:', error);
            throw error;
        }
    },

    // Get conversation with a specific user
    getConversation: async (userId) => {
        try {
            console.log('Getting conversation with user:', userId);
            const response = await fetch(`${API_BASE}/api/messages/conversation/${userId}`, {
                headers: ChatService.getAuthHeaders()
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Conversation API error:', response.status, errorText);
                
                if (response.status === 429) {
                    throw new Error('Rate limited: Too many requests. Please wait a moment.');
                }
                throw new Error(`Failed to get conversation: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Conversation data:', data);
            return data;
        } catch (error) {
            console.error('Error getting conversation:', error);
            throw error;
        }
    },

    // Send a message
    sendMessage: async (receiverId, content) => {
        try {
            console.log('Sending message to:', receiverId, 'Content:', content);
            const response = await fetch(`${API_BASE}/api/messages/send`, {
                method: 'POST',
                headers: {
                    ...ChatService.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    receiverId: receiverId,
                    content: content
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Send message API error:', response.status, errorText);
                
                if (response.status === 429) {
                    throw new Error('Rate limited: Too many requests. Please wait a moment before sending another message.');
                }
                throw new Error(`Failed to send message: ${response.status}`);
            }
            
            // The backend returns void (no content), so we don't try to parse JSON
            // Just return success if status is 200/201/204
            console.log('Message sent successfully');
            return { success: true };
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    },

    // Get user details by ID
    getUserDetails: async (userId) => {
        try {
            console.log('Getting user details for:', userId);
            const response = await fetch(`${API_BASE}/api/users/${userId}`, {
                headers: ChatService.getAuthHeaders()
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('User details API error:', response.status, errorText);
                
                if (response.status === 429) {
                    throw new Error('Rate limited: Too many requests. Please wait a moment.');
                }
                throw new Error(`Failed to get user details: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('User details:', data);
            return data;
        } catch (error) {
            console.error('Error getting user details:', error);
            throw error;
        }
    },

    // Get user profile by ID
    getUserProfile: async (userId) => {
        try {
            console.log('Getting user profile for:', userId);
            const response = await fetch(`${API_BASE}/api/profiles/${userId}`, {
                headers: ChatService.getAuthHeaders()
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('User profile API error:', response.status, errorText);
                
                if (response.status === 429) {
                    throw new Error('Rate limited: Too many requests. Please wait a moment.');
                }
                throw new Error(`Failed to get user profile: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('User profile:', data);
            return data;
        } catch (error) {
            console.error('Error getting user profile:', error);
            throw error;
        }
    },

    // Format timestamp for display
    formatTimestamp: (timestamp) => {
        const date = new Date(Number(timestamp));
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);
        
        if (diffInHours < 1) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString();
        }
    },

    // Check if message is from current user
    isOwnMessage: (message) => {
        const currentUser = AuthService.getCurrentUser();
        return currentUser && String(message.senderId) === String(currentUser.id);
    }
}; 