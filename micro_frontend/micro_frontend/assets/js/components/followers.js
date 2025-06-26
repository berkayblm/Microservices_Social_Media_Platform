const FollowersComponent = {
    init: () => {
        // Initialize followers functionality
        FollowersComponent.setupFollowButtons();
        FollowersComponent.setupFollowersModal();
        FollowersComponent.setupFollowingModal();
    },

    setupFollowButtons: () => {
        document.addEventListener('click', async (e) => {
            if (e.target.matches('.follow-btn')) {
                const userId = e.target.dataset.userId;
                const currentUser = authService.getCurrentUser();
                
                if (!currentUser) {
                    window.location.href = '/login.html';
                    return;
                }

                try {
                    if (e.target.classList.contains('following')) {
                        await FollowersService.unfollowUser(currentUser.id, userId);
                        e.target.classList.remove('following', 'btn-primary');
                        e.target.classList.add('btn-outline-primary');
                        e.target.textContent = 'Follow';
                    } else {
                        await FollowersService.followUser(currentUser.id, userId);
                        e.target.classList.add('following', 'btn-primary');
                        e.target.classList.remove('btn-outline-primary');
                        e.target.textContent = 'Following';
                    }
                } catch (error) {
                    console.error('Error toggling follow:', error);
                    alert('Failed to update follow status');
                }
            }
        });
    },

    setupFollowersModal: () => {
        const followersModal = document.getElementById('followersModal');
        if (followersModal) {
            followersModal.addEventListener('show.bs.modal', async (event) => {
                const userId = event.relatedTarget ? event.relatedTarget.dataset.userId : null;
                console.log('Followers modal opened for userId:', userId);
                const followersList = document.getElementById('followersList');
                followersList.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';

                try {
                    const followers = await FollowersService.getFollowers(userId);
                    console.log('Followers response:', followers);
                    followersList.innerHTML = followers.length ? '' : '<p class="text-center text-muted">No followers yet</p>';
                    followers.forEach(follow => {
                        const follower = follow.follower;
                        followersList.innerHTML += `
                            <div class="d-flex align-items-center p-2 border-bottom">
                                <div class="flex-shrink-0">
                                    <a href="profile.html?userId=${follower.id}">
                                        <img src="${follower.profilePhotoUrl || 'assets/img/default-avatar.png'}" 
                                             class="rounded-circle" 
                                             width="40" 
                                             height="40" 
                                             alt="${follower.username}">
                                    </a>
                                </div>
                                <div class="flex-grow-1 ms-3">
                                    <a href="profile.html?userId=${follower.id}" class="text-decoration-none text-dark">
                                        <h6 class="mb-0">${follower.displayName || follower.username}</h6>
                                        <small class="text-muted">@${follower.username}</small>
                                    </a>
                                </div>
                            </div>
                        `;
                    });
                } catch (error) {
                    console.error('Error loading followers:', error);
                    followersList.innerHTML = '<p class="text-center text-danger">Failed to load followers</p>';
                }
            });
        }
    },

    setupFollowingModal: () => {
        const followingModal = document.getElementById('followingModal');
        if (followingModal) {
            followingModal.addEventListener('show.bs.modal', async (event) => {
                const userId = event.relatedTarget.dataset.userId;
                const followingList = document.getElementById('followingList');
                followingList.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';

                try {
                    const following = await FollowersService.getFollowing(userId);
                    followingList.innerHTML = following.length ? '' : '<p class="text-center text-muted">Not following anyone yet</p>';
                    
                    following.forEach(follow => {
                        const followingUser = follow.following;
                        followingList.innerHTML += `
                            <div class="d-flex align-items-center p-2 border-bottom">
                                <div class="flex-shrink-0">
                                    <a href="profile.html?userId=${followingUser.id}">
                                        <img src="${followingUser.profilePhotoUrl || 'assets/img/default-avatar.png'}" 
                                             class="rounded-circle" 
                                             width="40" 
                                             height="40" 
                                             alt="${followingUser.username}">
                                    </a>
                                </div>
                                <div class="flex-grow-1 ms-3">
                                    <a href="profile.html?userId=${followingUser.id}" class="text-decoration-none text-dark">
                                        <h6 class="mb-0">${followingUser.displayName || followingUser.username}</h6>
                                        <small class="text-muted">@${followingUser.username}</small>
                                    </a>
                                </div>
                            </div>
                        `;
                    });
                } catch (error) {
                    console.error('Error loading following:', error);
                    followingList.innerHTML = '<p class="text-center text-danger">Failed to load following</p>';
                }
            });
        }
    },

    updateFollowCounts: async (userId) => {
        try {
            const counts = await FollowersService.getFollowCounts(userId);
            document.getElementById('followersCount').textContent = counts.followers;
            document.getElementById('followingCount').textContent = counts.following;
        } catch (error) {
            console.error('Error updating follow counts:', error);
        }
    },

    setupProfileFollowButton: async (profileUserId) => {
        const followBtn = document.getElementById('followButton');
        const editProfileBtn = document.getElementById('editProfileButton');
        const currentUser = AuthService.getCurrentUser();

        if (!followBtn) return;

        // Hide by default
        followBtn.style.display = 'none';
        if (editProfileBtn) editProfileBtn.style.display = 'none';

        if (!currentUser) return;

        if (currentUser.id === profileUserId) {
            // Viewing own profile: show edit, hide follow
            if (editProfileBtn) editProfileBtn.style.display = '';
            followBtn.style.display = 'none';
        } else {
            // Viewing someone else's profile: show follow, hide edit
            if (editProfileBtn) editProfileBtn.style.display = 'none';
            followBtn.style.display = '';
            followBtn.dataset.userId = profileUserId;

            // Set initial state
            try {
                const res = await FollowersService.isFollowing(currentUser.id, profileUserId);
                if (res && res.following) {
                    followBtn.classList.add('following', 'btn-primary');
                    followBtn.classList.remove('btn-outline-primary');
                    followBtn.textContent = 'Following';
                } else {
                    followBtn.classList.remove('following', 'btn-primary');
                    followBtn.classList.add('btn-outline-primary');
                    followBtn.textContent = 'Follow';
                }
            } catch (e) {
                followBtn.classList.remove('following', 'btn-primary');
                followBtn.classList.add('btn-outline-primary');
                followBtn.textContent = 'Follow';
            }
        }
    }
}; 