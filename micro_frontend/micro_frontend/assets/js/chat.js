/**
 * Enhanced Chat Controller
 */
const ChatController = {
    selectedUserId: null,
    selectedUserProfile: null,
    currentUser: null,
    refreshInterval: null,
    pollingInterval: 10000, // Increased to 10 seconds to reduce rate limiting
    maxRetries: 3,
    retryCount: 0,

    // Initialize chat page
    init: async () => {
        try {
            ChatController.currentUser = AuthService.getCurrentUser();
            if (!ChatController.currentUser) {
                window.location.href = '/login.html';
                return;
            }

            await ChatController.loadChatInterface();
            ChatController.setupEventListeners();
            
            // Start auto-refresh for active conversation with longer interval
            ChatController.startAutoRefresh();
        } catch (err) {
            console.error('Chat init error:', err);
            alert('Failed to initialize chat.');
        }
    },

    // Load the main chat interface
    loadChatInterface: async () => {
        try {
            await ChatController.loadFollowingList();
            await ChatController.loadConversationList();
        } catch (error) {
            console.error('Error loading chat interface:', error);
        }
    },

    // Load following users for new conversations
    loadFollowingList: async () => {
        try {
            const followingList = document.getElementById('followingList');
            if (!followingList) return;

            followingList.innerHTML = '<div class="text-center p-3">Loading...</div>';

            const following = await ChatService.getFollowingForChat();
            
            if (!following.length) {
                followingList.innerHTML = '<div class="text-center p-3 text-muted">No following users to chat with.</div>';
                return;
            }

            // Get user details for each following user
            const userDetailsPromises = following.map(async (follow) => {
                try {
                    const userProfile = await ChatService.getUserProfile(follow.following.id);
                    return {
                        id: follow.following.id,
                        username: userProfile.username || follow.following.username,
                        displayName: userProfile.displayName || userProfile.username,
                        profilePhoto: userProfile.profilePhoto || userProfile.profilePictureUrl || null
                    };
                } catch (error) {
                    console.error('Error getting user details:', error);
                    return {
                        id: follow.following.id,
                        username: follow.following.username,
                        displayName: follow.following.username,
                        profilePhoto: null
                    };
                }
            });

            const userDetails = await Promise.all(userDetailsPromises);

            followingList.innerHTML = userDetails.map(user => {
                const avatarHtml = renderAvatar(user, 40, 'me-3');
                
                return `
                    <div class="list-group-item list-group-item-action d-flex align-items-center" 
                         onclick="ChatController.selectUserForChat('${user.id}', '${user.username}', '${user.displayName}')">
                        ${avatarHtml}
                        <div>
                            <div class="fw-bold">${user.displayName}</div>
                            <small class="text-muted">@${user.username}</small>
                        </div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Error loading following list:', error);
            const followingList = document.getElementById('followingList');
            if (followingList) {
                followingList.innerHTML = '<div class="text-center p-3 text-danger">Failed to load following users.</div>';
            }
        }
    },

    // Load existing conversations
    loadConversationList: async () => {
        try {
            const conversationList = document.getElementById('conversationList');
            if (!conversationList) return;

            conversationList.innerHTML = '<div class="text-center p-3">Loading...</div>';

            const conversationPartners = await ChatService.getConversationPartners();
            
            if (!conversationPartners.length) {
                conversationList.innerHTML = '<div class="text-center p-3 text-muted">No conversations yet.</div>';
                return;
            }

            // Get user details for each conversation partner
            const userDetailsPromises = conversationPartners.map(async (userId) => {
                try {
                    const userProfile = await ChatService.getUserProfile(userId);
                    return {
                        id: userId,
                        username: userProfile.username,
                        displayName: userProfile.displayName || userProfile.username,
                        profilePhoto: userProfile.profilePhoto || userProfile.profilePictureUrl || null
                    };
                } catch (error) {
                    console.error('Error getting user details:', error);
                    return {
                        id: userId,
                        username: `User ${userId}`,
                        displayName: `User ${userId}`,
                        profilePhoto: null
                    };
                }
            });

            const userDetails = await Promise.all(userDetailsPromises);

            conversationList.innerHTML = userDetails.map(user => {
                const avatarHtml = renderAvatar(user, 40, 'me-3');
                
                return `
                    <div class="list-group-item list-group-item-action d-flex align-items-center" 
                         onclick="ChatController.selectUserForChat('${user.id}', '${user.username}', '${user.displayName}')">
                        ${avatarHtml}
                        <div>
                            <div class="fw-bold">${user.displayName}</div>
                            <small class="text-muted">@${user.username}</small>
                        </div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Error loading conversation list:', error);
            const conversationList = document.getElementById('conversationList');
            if (conversationList) {
                conversationList.innerHTML = '<div class="text-center p-3 text-danger">Failed to load conversations.</div>';
            }
        }
    },

    // Select a user to chat with
    selectUserForChat: async (userId, username, displayName) => {
        try {
            ChatController.selectedUserId = userId;
            ChatController.selectedUserProfile = { username, displayName };
            
            // Update UI to show selected user
            document.getElementById('chatWithHeader').textContent = `Chat with ${displayName}`;
            document.getElementById('messageInput').disabled = false;
            document.getElementById('sendMessageBtn').disabled = false;
            
            // Load conversation
            await ChatController.loadMessages(userId);
            
            // Focus on message input
            document.getElementById('messageInput').focus();
            
        } catch (error) {
            console.error('Error selecting user for chat:', error);
        }
    },

    // Load messages for a conversation with rate limiting handling
    loadMessages: async (userId) => {
        try {
            const messagesDiv = document.getElementById('messages');
            if (!messagesDiv) return;

            // Don't show loading if it's a background refresh
            if (!messagesDiv.innerHTML.includes('Loading messages...')) {
                messagesDiv.innerHTML = '<div class="chat-loading"><div class="spinner-border" role="status"></div>Loading messages...</div>';
            }

            const messages = await ChatService.getConversation(userId);
            
            if (!messages.length) {
                messagesDiv.innerHTML = '<div class="chat-empty-state"><i class="bi bi-chat-dots"></i><p>No messages yet. Start the conversation!</p></div>';
                return;
            }

            messagesDiv.innerHTML = `
                <div class="messages-container">
                    ${messages.map(message => {
                        const isOwn = ChatService.isOwnMessage(message);
                        const timestamp = ChatService.formatTimestamp(message.timestamp);
                        
                        return `
                            <div class="message-row ${isOwn ? 'own-message' : 'other-message'}">
                                <div class="message-content ${isOwn ? 'own-message' : 'other-message'}">
                                    <div class="message-bubble ${isOwn ? 'bg-primary text-white' : 'bg-light'}">
                                        ${message.content}
                                    </div>
                                    <div class="message-timestamp">${timestamp}</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;

            // Scroll to bottom
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
            
            // Reset retry count on successful request
            ChatController.retryCount = 0;

        } catch (error) {
            console.error('Error loading messages:', error);
            
            // Handle rate limiting specifically
            if (error.message && error.message.includes('429')) {
                console.warn('Rate limited - backing off...');
                ChatController.handleRateLimit();
                return;
            }
            
            const messagesDiv = document.getElementById('messages');
            if (messagesDiv && !messagesDiv.innerHTML.includes('Failed to load messages')) {
                messagesDiv.innerHTML = '<div class="chat-loading text-danger"><i class="bi bi-exclamation-triangle"></i>Failed to load messages.</div>';
            }
        }
    },

    // Handle rate limiting with exponential backoff
    handleRateLimit: () => {
        ChatController.retryCount++;
        
        if (ChatController.retryCount <= ChatController.maxRetries) {
            // Exponential backoff: 10s, 20s, 40s
            const backoffTime = ChatController.pollingInterval * Math.pow(2, ChatController.retryCount - 1);
            console.log(`Rate limited. Retrying in ${backoffTime/1000} seconds...`);
            
            // Temporarily increase polling interval
            ChatController.stopAutoRefresh();
            setTimeout(() => {
                ChatController.startAutoRefresh();
            }, backoffTime);
        } else {
            console.warn('Max retries reached. Stopping auto-refresh.');
            ChatController.stopAutoRefresh();
        }
    },

    // Send a message
    sendMessage: async (content) => {
        if (!ChatController.selectedUserId || !content.trim()) return;

        try {
            await ChatService.sendMessage(ChatController.selectedUserId, content.trim());
            
            // Reload messages to show the new message
            await ChatController.loadMessages(ChatController.selectedUserId);
            
            // Clear input
            document.getElementById('messageInput').value = '';
            
        } catch (error) {
            console.error('Error sending message:', error);
            
            // Handle rate limiting for send message
            if (error.message && error.message.includes('429')) {
                alert('Rate limited. Please wait a moment before sending another message.');
            } else {
                alert('Failed to send message. Please try again.');
            }
        }
    },

    // Setup event listeners
    setupEventListeners: () => {
        // Send message form
        const sendMessageForm = document.getElementById('sendMessageForm');
        if (sendMessageForm) {
            sendMessageForm.onsubmit = (e) => {
                e.preventDefault();
                const input = document.getElementById('messageInput');
                const content = input.value.trim();
                if (content) {
                    ChatController.sendMessage(content);
                }
            };
        }

        // Enter key to send message
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.onkeypress = (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const content = messageInput.value.trim();
                    if (content) {
                        ChatController.sendMessage(content);
                    }
                }
            };
        }

        // Refresh conversations button
        const refreshBtn = document.getElementById('refreshConversationsBtn');
        if (refreshBtn) {
            refreshBtn.onclick = () => ChatController.loadConversationList();
        }

        // Refresh following button
        const refreshFollowingBtn = document.getElementById('refreshFollowingBtn');
        if (refreshFollowingBtn) {
            refreshFollowingBtn.onclick = () => ChatController.loadFollowingList();
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.onclick = (e) => {
                e.preventDefault();
                AuthService.logout();
            };
        }

        // Setup user dropdown
        ChatController.setupUserDropdown();
    },

    // Setup user dropdown with current user info
    setupUserDropdown: () => {
        const currentUser = AuthService.getCurrentUser();
        if (currentUser) {
            const currentUsernameElement = document.getElementById('currentUsername');
            if (currentUsernameElement) {
                currentUsernameElement.textContent = currentUser.username || 'User';
            }
        }
    },

    // Start auto-refresh for active conversation with configurable interval
    startAutoRefresh: () => {
        // Refresh messages every 10 seconds if there's an active conversation
        ChatController.refreshInterval = setInterval(() => {
            if (ChatController.selectedUserId) {
                ChatController.loadMessages(ChatController.selectedUserId);
            }
        }, ChatController.pollingInterval);
    },

    // Stop auto-refresh
    stopAutoRefresh: () => {
        if (ChatController.refreshInterval) {
            clearInterval(ChatController.refreshInterval);
            ChatController.refreshInterval = null;
        }
    }
};

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', ChatController.init);

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    ChatController.stopAutoRefresh();
});

// Utility function to render user avatar
function renderAvatar(user, size = 40, extraClass = '') {
  if (user && (user.profilePhoto || user.profilePictureUrl)) {
    const url = user.profilePhoto || user.profilePictureUrl;
    return `<img src="${url}" class="rounded-circle ${extraClass}" width="${size}" height="${size}" alt="${user.displayName || user.username || 'User'}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
  } else {
    const initials = user && user.displayName
      ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
      : (user && user.username ? user.username.charAt(0).toUpperCase() : 'U');
    return `<div class="default-avatar rounded-circle ${extraClass}" style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:bold;color:#6c757d;background-color:#e9ecef;">${initials}</div>`;
  }
} 