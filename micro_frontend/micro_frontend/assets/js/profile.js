/**
 * Profile Page Controller
 */
const ProfileController = {
    // Initialize profile page
    init: async () => {
        const urlParams = new URLSearchParams(window.location.search);
        let userId = urlParams.get('userId');
        const username = urlParams.get('username');

        console.log('ProfileController init - userId:', userId, 'username:', username); // Debug log

        // If no user ID or username from URL, try to get current user's ID
        if (!userId && !username) {
            const currentUser = AuthService.getCurrentUser();
            console.log('Current user:', currentUser, 'currentUser.id:', currentUser.id);
            if (currentUser && currentUser.id) {
                userId = currentUser.id; // Use current user's ID if available
            } else {
                console.log('No user is logged in, redirecting to feed');
                window.location.href = './feed.html'; // Fallback to feed if no user is logged in
                return;
            }
        }

        let profile = null;
        if (userId) {
            profile = await API.profiles.getByUserId(userId);
        } else if (username) {
            profile = await API.profiles.getByUsername(username);
        }

        if (profile) {
            ProfileController.renderProfile(profile);
            ProfileController.loadUserPosts(profile.userId); // Load posts for the profile
        } else {
            // Handle profile not found
            document.querySelector('main').innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-exclamation-circle fa-3x text-danger mb-3"></i>
                    <h4>Profile Not Found</h4>
                    <p class="text-muted">The profile you are looking for does not exist.</p>
                    <a href="./feed.html" class="btn btn-primary">Go to Feed</a>
                </div>
            `;
        }

        // Setup logout button
        document.getElementById('logoutBtn').addEventListener('click', AuthService.logout);
    },

    renderProfile: (profile) => {
        document.title = `${profile.username} - SocialApp`;
        document.getElementById('profileUsername').textContent = profile.username;
        document.getElementById('profileDisplayName').textContent = profile.displayName || profile.username;
        document.getElementById('profileBio').textContent = profile.bio || 'No bio yet.';
        document.getElementById('postCount').textContent = profile.postCount;
        document.getElementById('followerCount').textContent = profile.followerCount;
        document.getElementById('followingCount').textContent = profile.followingCount;

        // Handle profile picture
        const profileAvatar = document.getElementById('profileAvatar');
        if (profile.profilePictureUrl) {
            profileAvatar.innerHTML = `<img src="${profile.profilePictureUrl}" class="rounded-circle" width="150" height="150" alt="${profile.username}">`;
        } else {
            profileAvatar.textContent = profile.username.charAt(0).toUpperCase();
        }

        // TODO: Implement follow/unfollow logic
        const followButton = document.getElementById('followButton');
        const editProfileButton = document.getElementById('editProfileButton');
        const currentUser = AuthService.getCurrentUser();

        if (currentUser && currentUser.id === profile.userId) {
            followButton.classList.add('d-none');
            editProfileButton.classList.remove('d-none');
            editProfileButton.addEventListener('click', () => { /* Handle edit profile click */ alert('Edit profile clicked'); });
        } else {
            followButton.classList.remove('d-none');
            editProfileButton.classList.add('d-none');
            followButton.addEventListener('click', () => { /* Handle follow/unfollow click */ alert('Follow/Unfollow clicked'); });
        }
    },

    // TODO: Add functions to load and display user's posts
    loadUserPosts: async (userId, append = false) => {
        const postsGrid = document.getElementById('postsGrid');
        const postsLoader = document.getElementById('postsLoader');
        const noPostsMessage = document.getElementById('noPostsMessage');
        const loadMoreContainer = document.getElementById('loadMoreContainer');

        if (ProfileController.isLoading) return;
        ProfileController.isLoading = true;

        if (!append) {
            ProfileController.currentPage = 0;
            postsGrid.innerHTML = ''; // Clear existing posts
            noPostsMessage.classList.add('d-none'); // Hide no posts message initially
            postsLoader.classList.remove('d-none'); // Show loader
            loadMoreContainer.classList.add('d-none'); // Hide load more button initially
        } else {
            postsLoader.classList.remove('d-none'); // Show loader for loading more
        }

        try {
            const response = await API.posts.getByUserId(userId, ProfileController.currentPage, ProfileController.pageSize);
            console.log('User Posts Response:', response);

            postsLoader.classList.add('d-none'); // Hide loader

            if (response && response.posts && response.posts.length > 0) {
                response.posts.forEach(post => {
                    const postThumbnailElement = ProfileController.createPostThumbnail(post);
                    postsGrid.appendChild(postThumbnailElement);
                });

                ProfileController.currentPage++;
                ProfileController.hasMorePosts = ProfileController.currentPage < response.totalPages;

                if (ProfileController.hasMorePosts) {
                    loadMoreContainer.classList.remove('d-none');
                    document.getElementById('loadMorePostsBtn').onclick = () => ProfileController.loadUserPosts(userId, true);
                } else {
                    loadMoreContainer.classList.add('d-none');
                }

            } else if (!append) {
                noPostsMessage.classList.remove('d-none'); // Show no posts message
                loadMoreContainer.classList.add('d-none');
            }
        } catch (error) {
            console.error('Error loading user posts:', error);
            postsLoader.classList.add('d-none');
            const errorElement = document.createElement('div');
            errorElement.className = 'alert alert-danger text-center';
            errorElement.textContent = 'Failed to load posts. Please try again later.';
            postsGrid.appendChild(errorElement);
            loadMoreContainer.classList.add('d-none');
        } finally {
            ProfileController.isLoading = false;
        }
    },

    createPostThumbnail: (post) => {
        const col = document.createElement('div');
        col.className = 'col';
        col.innerHTML = `
            <img src="${post.imageUrl || 'https://via.placeholder.com/200?text=No+Image'}" class="img-fluid post-thumbnail" alt="${post.content}" data-post-id="${post.id}">
        `;
        // Add event listener to view post details on click
        col.querySelector('.post-thumbnail').addEventListener('click', () => {
            window.location.href = `./post-details.html?id=${post.id}`;
        });
        return col;
    }
};

// Initialize the profile controller when the DOM is loaded
document.addEventListener('DOMContentLoaded', ProfileController.init); 