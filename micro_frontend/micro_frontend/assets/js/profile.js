/**
 * Profile Page Controller
 */
const ProfileController = {
    // Initialize profile page
    init: async () => {
        try {
            // Get user ID from URL or current user
            const urlParams = new URLSearchParams(window.location.search);
            let userId = urlParams.get('userId');
            if (!userId) {
                const currentUser = AuthService.getCurrentUser();
                if (currentUser) {
                    userId = currentUser.id;
                } else {
                    alert('No user ID provided and no current user found');
                    window.location.href = '/login.html';
                    return;
                }
            }
            await ProfileController.loadProfile(userId);
        } catch (err) {
            console.error('Profile init error:', err);
            alert('Failed to initialize profile page.');
        }
    },

    loadProfile: async (userId) => {
        try {
            let profile;
            const currentUser = AuthService.getCurrentUser();
            if (currentUser && String(currentUser.id) === String(userId)) {
                profile = await API.profiles.getCurrentUserProfile();
                console.log('Profile response (current user):', profile);
            } else {
                // Send loggedInUserId header
                const token = localStorage.getItem('token');
                const res = await fetch(`${API.BASE_URL}/api/profiles/${userId}`, {
                    headers: {
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                        ...(currentUser ? { 'loggedInUserId': currentUser.id } : {})
                    }
                });
                if (!res.ok) throw new Error('Failed to fetch profile');
                profile = await res.json();
                console.log('Profile response (other user):', profile);
            }
            if (!profile) {
                alert('Profile not found.');
                window.location.href = '/feed.html';
                return;
            }

            // Defensive update profile UI
            const setText = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value;
            };

            setText('displayName', profile.displayName || profile.username);
            setText('username', `@${profile.username}`);
            setText('bio', profile.bio || 'No bio yet');
            setText('profileDisplayName', profile.displayName || profile.username);
            setText('profileBio', profile.bio || '');

            // Update profile avatar
            const avatarEl = document.getElementById('profileAvatar');
            if (avatarEl) {
                avatarEl.innerHTML = renderAvatar(profile, 100);
            }

            setText('postCount', profile.postCount || 0);
            setText('followerCount', profile.followerCount || 0);
            setText('followingCount', profile.followingCount || 0);
            // Also update the card section
            setText('followersCount', profile.followerCount || 0);
            setText('followingCount', profile.followingCount || 0);

            // Fetch and set accurate following count
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API.BASE_URL}/api/follows/${userId}/following`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
                if (res.ok) {
                    const followingList = await res.json();
                    const followingCount = Array.isArray(followingList) ? followingList.length : 0;
                    setText('followingCount', followingCount);
                    // If you have another element for card section, update it too
                    const followingCountCard = document.getElementById('followingCount');
                    if (followingCountCard) followingCountCard.textContent = followingCount;
                }
            } catch (err) {
                console.error('Failed to fetch following count:', err);
            }

            // Set data-user-id on modal triggers
            document.querySelectorAll('[data-bs-target="#followersModal"]').forEach(el => el.dataset.userId = userId);
            document.querySelectorAll('[data-bs-target="#followingModal"]').forEach(el => el.dataset.userId = userId);

            // --- Follow/Unfollow Button Logic ---
            const followBtn = document.getElementById('followButton');
            const editProfileBtn = document.getElementById('editProfileButton');
            if (followBtn) {
                followBtn.style.display = 'none';
                followBtn.classList.remove('following', 'btn-primary');
                followBtn.classList.add('btn-outline-primary');
                followBtn.textContent = 'Follow';
            }
            if (editProfileBtn) editProfileBtn.style.display = 'none';

            if (currentUser && String(currentUser.id) !== String(userId)) {
                // Viewing someone else's profile
                if (editProfileBtn) editProfileBtn.style.display = 'none';
                if (followBtn) {
                    followBtn.style.display = '';
                    followBtn.dataset.userId = userId;
                    // Use isFollowing from profile
                    if (profile.isFollowing) {
                        followBtn.classList.add('following', 'btn-primary');
                        followBtn.classList.remove('btn-outline-primary');
                        followBtn.textContent = 'Unfollow';
                    } else {
                        followBtn.classList.remove('following', 'btn-primary');
                        followBtn.classList.add('btn-outline-primary');
                        followBtn.textContent = 'Follow';
                    }
                    // Set click handler
                    followBtn.onclick = async () => {
                        try {
                            if (followBtn.classList.contains('following')) {
                                await FollowersService.unfollowUser(currentUser.id, userId);
                            } else {
                                await FollowersService.followUser(currentUser.id, userId);
                            }
                        } catch (err) {
                            console.error('Follow/unfollow error:', err);
                        } finally {
                            // Always re-fetch profile to update button state
                            await ProfileController.loadProfile(userId);
                        }
                    };
                }
            } else if (currentUser && String(currentUser.id) === String(userId)) {
                // Viewing own profile
                if (editProfileBtn) editProfileBtn.style.display = '';
                if (followBtn) followBtn.style.display = 'none';
            }

            // Load user's posts
            await ProfileController.loadUserPosts(userId);

            // Set up edit profile button
            if (editProfileBtn && currentUser && String(currentUser.id) === String(userId)) {
                editProfileBtn.onclick = () => {
                    document.getElementById('editDisplayName').value = profile.displayName || '';
                    document.getElementById('editBio').value = profile.bio || '';
                    
                    // Clear file input and preview
                    const fileInput = document.getElementById('editProfilePicture');
                    const preview = document.getElementById('profilePicturePreview');
                    if (fileInput) fileInput.value = '';
                    if (preview) {
                        preview.classList.add('d-none');
                        preview.querySelector('img').src = '';
                    }
                    
                    const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
                    modal.show();
                };
            }

            // Handle edit profile form submit
            const editProfileForm = document.getElementById('editProfileForm');
            if (editProfileForm && currentUser && String(currentUser.id) === String(userId)) {
                editProfileForm.onsubmit = async (e) => {
                    e.preventDefault();
                    
                    const profileData = {
                        displayName: document.getElementById('editDisplayName').value,
                        bio: document.getElementById('editBio').value
                    };
                    
                    // Add file if selected
                    const fileInput = document.getElementById('editProfilePicture');
                    if (fileInput && fileInput.files[0]) {
                        profileData.file = fileInput.files[0];
                    }
                    
                    try {
                        await API.profiles.updateCurrentUserProfile(profileData);
                        await ProfileController.loadProfile(userId);
                        bootstrap.Modal.getInstance(document.getElementById('editProfileModal')).hide();
                    } catch (err) {
                        alert('Failed to update profile: ' + (err.message || 'Unknown error'));
                    }
                };
            }

            // Set up profile picture preview
            const profilePictureInput = document.getElementById('editProfilePicture');
            if (profilePictureInput) {
                profilePictureInput.addEventListener('change', ProfileController.handleProfilePicturePreview);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            alert('Failed to load profile. Please try again later.');
            window.location.href = '/feed.html';
        }
    },

    loadUserPosts: async (userId) => {
        try {
            const postsGrid = document.getElementById('postsGrid');
            const noPostsMessage = document.getElementById('noPostsMessage');
            if (!postsGrid) return;

            // Fetch posts and total count
            const token = localStorage.getItem('token');
            const res = await fetch(`${API.BASE_URL}/api/posts/user/${userId}?page=0&size=12`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (!res.ok) throw new Error('Failed to fetch posts');
            const postsResponse = await res.json();
            console.log('Posts response:', postsResponse);
            // Set post count from totalElements
            const postCount = postsResponse.totalItems || postsResponse.totalElements || 0;
            const postCountEl = document.getElementById('postCount');
            if (postCountEl) postCountEl.textContent = postCount;

            // Extract posts array
            const posts = Array.isArray(postsResponse)
                ? postsResponse
                : (postsResponse && Array.isArray(postsResponse.posts) ? postsResponse.posts
                    : (postsResponse && Array.isArray(postsResponse.content) ? postsResponse.content : []));

            postsGrid.innerHTML = '';

            if (!posts.length) {
                postsGrid.innerHTML = '<p class="text-center text-muted">No posts yet</p>';
                if (noPostsMessage) noPostsMessage.classList.remove('d-none');
                return;
            } else {
                if (noPostsMessage) noPostsMessage.classList.add('d-none');
            }

            posts.forEach(post => {
                const postElement = ProfileController.createPostThumbnail(post);
                postsGrid.appendChild(postElement);
            });
        } catch (error) {
            console.error('Error loading posts:', error);
            const postsGrid = document.getElementById('postsGrid');
            if (postsGrid) {
                postsGrid.innerHTML = '<p class="text-center text-danger">Failed to load posts</p>';
            }
        }
    },

    createPostThumbnail: (post) => {
        const col = document.createElement('div');
        col.className = 'col';

        if (post.imageUrl) {
            // If the post has an image, show the image
            col.innerHTML = `
                <img src="${post.imageUrl}" 
                     class="img-fluid post-thumbnail" 
                     alt="${post.content || ''}" 
                     data-post-id="${post.id}">
            `;
        } else {
            // If no image, show a styled card with text content
            col.innerHTML = `
                <div class="card post-thumbnail text-center p-3" data-post-id="${post.id}" style="cursor:pointer;">
                    <h6 class="mb-2">${post.title || 'Untitled'}</h6>
                    <p class="mb-0 text-muted" style="font-size:0.95em;">${post.content ? post.content.substring(0, 100) : ''}</p>
                </div>
            `;
        }

        // Add click event to both image and card
        const clickable = col.querySelector('.post-thumbnail');
        if (clickable) {
            clickable.addEventListener('click', () => {
                window.location.href = `./post-details.html?id=${post.id}`;
            });
        }

        return col;
    },

    // Handle profile picture preview
    handleProfilePicturePreview: (event) => {
        const file = event.target.files[0];
        const preview = document.getElementById('profilePicturePreview');
        const previewImg = preview.querySelector('img');

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
                preview.classList.remove('d-none');
            };
            reader.readAsDataURL(file);
        } else {
            preview.classList.add('d-none');
            previewImg.src = '';
        }
    }
};

// Initialize profile when DOM is loaded
document.addEventListener('DOMContentLoaded', ProfileController.init);

document.addEventListener('DOMContentLoaded', function () {
  // For all modals
  document.querySelectorAll('.modal').forEach(modalEl => {
    modalEl.addEventListener('hidden.bs.modal', function (event) {
      // Find the trigger element (the one that opened the modal)
      const trigger = document.querySelector(`[data-bs-target="#${modalEl.id}"]`);
      if (trigger) {
        trigger.focus();
      } else {
        // Fallback: focus the body or another visible element
        document.body.focus();
      }
    });
  });

  // Followers Modal: Load followers when opened
  const followersModal = document.getElementById('followersModal');
  if (followersModal) {
    followersModal.addEventListener('show.bs.modal', async function (event) {
      // Get userId from the trigger element
      const trigger = event.relatedTarget || document.querySelector('[data-bs-target="#followersModal"]');
      const userId = trigger ? trigger.dataset.userId : null;
      if (!userId) return;

      const followersList = document.getElementById('followersList');
      followersList.innerHTML = '<div class="text-center p-3">Loading...</div>';

      try {
        // Replace with your actual API call for followers
        const token = localStorage.getItem('token');
        const res = await fetch(`${API.BASE_URL}/api/follows/${userId}/followers`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error('Failed to fetch followers');
        const followers = await res.json();

        if (!followers.length) {
          followersList.innerHTML = '<div class="text-center p-3 text-muted">No followers yet.</div>';
        } else {
          followersList.innerHTML = followers.map(follow =>
            follow.follower
              ? `<a href="profile.html?userId=${follow.follower.id}" class="list-group-item list-group-item-action">
                  <img src="${follow.follower.profilePhotoUrl || 'assets/img/default-avatar.png'}" class="rounded-circle me-2" width="32" height="32" alt="">
                  <strong>${follow.follower.displayName || follow.follower.username}</strong> <span class="text-muted">@${follow.follower.username}</span>
                </a>`
              : ''
          ).join('');
        }
      } catch (err) {
        followersList.innerHTML = '<div class="text-center p-3 text-danger">Failed to load followers.</div>';
        console.error('Error loading followers:', err);
      }
    });
  }

  // Following Modal: Load following when opened
  const followingModal = document.getElementById('followingModal');
  if (followingModal) {
    followingModal.addEventListener('show.bs.modal', async function (event) {
      // Get userId from the trigger element
      const trigger = event.relatedTarget || document.querySelector('[data-bs-target="#followingModal"]');
      const userId = trigger ? trigger.dataset.userId : null;
      if (!userId) return;

      const followingList = document.getElementById('followingList');
      followingList.innerHTML = '<div class="text-center p-3">Loading...</div>';

      try {
        // API call for following
        const token = localStorage.getItem('token');
        const res = await fetch(`${API.BASE_URL}/api/follows/${userId}/following`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error('Failed to fetch following');
        const following = await res.json();

        if (!following.length) {
          followingList.innerHTML = '<div class="text-center p-3 text-muted">Not following anyone yet.</div>';
        } else {
          followingList.innerHTML = following.map(follow =>
            follow.following
              ? `<a href="profile.html?userId=${follow.following.id}" class="list-group-item list-group-item-action">
                  <img src="${follow.following.profilePhotoUrl || 'assets/img/default-avatar.png'}" class="rounded-circle me-2" width="32" height="32" alt="">
                  <strong>${follow.following.displayName || follow.following.username}</strong> <span class="text-muted">@${follow.following.username}</span>
                </a>`
              : ''
          ).join('');
        }
      } catch (err) {
        followingList.innerHTML = '<div class="text-center p-3 text-danger">Failed to load following.</div>';
        console.error('Error loading following:', err);
      }
    });
  }
});

// Utility function to render user avatar
function renderAvatar(user, size = 40, extraClass = '') {
  if (user && (user.profilePhoto || user.profilePictureUrl)) {
    const url = user.profilePhoto || user.profilePictureUrl;
    return `<img src="${url}" class="rounded-circle ${extraClass}" width="${size}" height="${size}" alt="${(user.displayName || user.username || 'User')}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
  } else {
    const initials = user && user.displayName
      ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
      : (user && user.username ? user.username.charAt(0).toUpperCase() : 'U');
    return `<div class="default-avatar rounded-circle ${extraClass}" style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:bold;color:#6c757d;background-color:#e9ecef;">${initials}</div>`;
  }
} 