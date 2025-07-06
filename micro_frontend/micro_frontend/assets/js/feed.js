/**
 * Feed Page Controller
 */
const FeedController = {
  currentPage: 0,
  pageSize: 10,
  hasMorePosts: true,
  currentUserId: null,
  isLoading: false,

  // Initialize feed page
  init: async () => {
    // Get the current user ID when initializing
    const currentUser = AuthService.getCurrentUser();
    FeedController.currentUserId = currentUser ? currentUser.id : null;
    console.log('Current user retrieved:', FeedController.currentUserId);

    // Update View Profile link with user ID
    const viewProfileBtn = document.getElementById('viewProfileBtn');
    if (viewProfileBtn && FeedController.currentUserId) {
      viewProfileBtn.href = `profile.html?userId=${FeedController.currentUserId}`;
    }

    // Alternative method: Get from a data attribute in your HTML
    const postsFeed = document.getElementById('postsFeed');
    if (postsFeed && postsFeed.dataset.userId) {
      FeedController.currentUserId = parseInt(postsFeed.dataset.userId);
    }

    // Check if we're on the feed page
    if (!postsFeed) {
      return; // Exit if not on feed page
    }

    console.log('Feed initialized with user ID:', FeedController.currentUserId);

    // Load initial posts
    await FeedController.loadPosts();

    // Load recommended users
    await FeedController.loadRecommendedUsers();

    // Set up event listeners
    const submitPostBtn = document.getElementById('submitPostBtn');
    if (submitPostBtn) {
      submitPostBtn.addEventListener('click', FeedController.createPost);
    }

    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', FeedController.loadMorePosts);
    }

    // Set up refresh recommended users button
    const refreshRecommendedBtn = document.getElementById('refreshRecommendedBtn');
    if (refreshRecommendedBtn) {
      refreshRecommendedBtn.addEventListener('click', FeedController.loadRecommendedUsers);
    }

    // Set up randomize recommended users button
    const randomizeRecommendedBtn = document.getElementById('randomizeRecommendedBtn');
    if (randomizeRecommendedBtn) {
      randomizeRecommendedBtn.addEventListener('click', FeedController.randomizeRecommendedUsers);
    }

    // Set up infinite scroll
    window.addEventListener('scroll', FeedController.handleScroll);

    // Set up image preview
    const postImage = document.getElementById('postImage');
    if (postImage) {
      postImage.addEventListener('change', FeedController.handleImagePreview);
    }
  },

  // Handle scroll for infinite loading
  handleScroll: () => {
    if (FeedController.isLoading || !FeedController.hasMorePosts) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const bodyHeight = document.body.offsetHeight;

    // Load more posts when user scrolls to 80% of the page
    if (scrollPosition >= bodyHeight * 0.8) {
      FeedController.loadMorePosts();
    }
  },

  // Load posts from API
  loadPosts: async (append = false) => {
    if (FeedController.isLoading) return;
    FeedController.isLoading = true;

    // When appending, we want to use the next page
    const pageToFetch = append ? FeedController.currentPage : 0;

    if (!append) {
      FeedController.currentPage = 0;
      // Clear existing posts and show loader
      const postsFeed = document.getElementById('postsFeed');
      if (postsFeed) postsFeed.innerHTML = '';

      const postsLoader = document.getElementById('postsLoader');
      if (postsLoader) postsLoader.classList.remove('d-none');

      const loadMoreContainer = document.getElementById('loadMoreContainer');
      if (loadMoreContainer) loadMoreContainer.classList.add('d-none');
    }

    try {
      // Use the calculated page
      const response = await API.posts.getAll(pageToFetch, FeedController.pageSize);

      console.log('API Response for posts:', response);

      // If we got a valid response with posts
      const posts = response.posts || response.content || [];
      if (posts && posts.length > 0) {
        // Update pagination information - fix the logic
        FeedController.hasMorePosts = pageToFetch < (response.totalPages ? response.totalPages - 1 : 0);

        // Show or hide load more button
        const loadMoreContainer = document.getElementById('loadMoreContainer');
        if (loadMoreContainer) {
          if (FeedController.hasMorePosts) {
            loadMoreContainer.classList.remove('d-none');
          } else {
            loadMoreContainer.classList.add('d-none');
          }
        }

        // Render posts
        const postsFeed = document.getElementById('postsFeed');
        if (postsFeed) {
          posts.forEach(post => {
            const postElement = FeedController.createPostElement(post);
            postsFeed.appendChild(postElement);
          });
        }

        // Update current page for next load - only update after successful response
        FeedController.currentPage = pageToFetch + 1;
      } else {
        // Handle empty response
        if (!append) {
          const postsFeed = document.getElementById('postsFeed');
          if (postsFeed) {
            const emptyState = document.createElement('div');
            emptyState.className = 'text-center py-5';
            emptyState.innerHTML = `
              <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
              <h4>No posts yet</h4>
              <p class="text-muted">Be the first to create a post!</p>
            `;
            postsFeed.appendChild(emptyState);
          }
        }

        FeedController.hasMorePosts = false;
        const loadMoreContainer = document.getElementById('loadMoreContainer');
        if (loadMoreContainer) loadMoreContainer.classList.add('d-none');
      }
    } catch (error) {
      console.error('Error loading posts:', error);

      // Handle error cases
      const postsLoader = document.getElementById('postsLoader');
      if (postsLoader) {
        postsLoader.classList.add('d-none');
      }

      if (!append) {
        const postsFeed = document.getElementById('postsFeed');
        if (postsFeed) {
          const errorElement = document.createElement('div');
          errorElement.className = 'alert alert-danger';
          errorElement.textContent = 'Failed to load posts. Please try again later.';
          postsFeed.appendChild(errorElement);
        }
      }
    } finally {
      FeedController.isLoading = false;
    }
  },

  // Load more posts
  loadMorePosts: async () => {
    await FeedController.loadPosts(true);
  },

  // Create post element
  createPostElement: (post) => {
    const postElement = document.createElement('div');
    postElement.className = 'card mb-3 post-card';
    postElement.dataset.postId = post.id;

    // Create post content
    let imageHtml = '';
    if (post.imageUrl) {
      imageHtml = `
        <div class="post-image-container">
          <img src="${post.imageUrl}" alt="Post image" class="img-fluid rounded post-image mb-3">
        </div>
      `;
    }

    postElement.innerHTML = `
       <div class="card-body">
         <div class="d-flex align-items-center mb-2">
           ${renderAvatar(post.author, 40, 'me-2')}
           <div>
             <h6 class="mb-0">
               <a href="./profile.html?userId=${post.author.id}" class="text-decoration-none text-dark">
                 ${post.author.displayName || post.author.username}
               </a>
             </h6>
             <small class="text-muted">@${post.author.username} · ${new Date(post.createdAt).toLocaleString()}</small>
           </div>
         </div>
         <h5 class="card-title post-title">${post.title}</h5>
         <p class="card-text post-content">${post.content}</p>
         ${imageHtml}
         <div class="d-flex justify-content-between">
           <button class="btn btn-sm ${post.likedByCurrentUser ? 'btn-primary' : 'btn-outline-primary'} like-button" data-post-id="${post.id}">
             <i class="${post.likedByCurrentUser ? 'fas' : 'far'} fa-heart"></i>
             <span class="like-count">${post.likeCount || 0}</span>
           </button>
           <button class="btn btn-sm btn-outline-secondary comment-button" data-post-id="${post.id}">
             <i class="far fa-comment"></i> ${post.commentCount || 0}
           </button>
         </div>
         <div class="comments-section d-none mt-3">
           <hr>
           <div class="comments-container"></div>
           <div class="mt-3">
             <textarea class="form-control comment-input" rows="1" placeholder="Add a comment..."></textarea>
             <button class="btn btn-primary btn-sm mt-2 submit-comment-btn" data-post-id="${post.id}">Post</button>
           </div>
         </div>
       </div>
     `;

    // Set up event listeners
    const likeButton = postElement.querySelector('.like-button');
    likeButton.addEventListener('click', () => {
      PostController.toggleLike(post.id, likeButton);
    });

    const commentButton = postElement.querySelector('.comment-button');
    commentButton.addEventListener('click', () => {
      PostController.toggleComments(post.id, postElement);
    });

    const submitCommentBtn = postElement.querySelector('.submit-comment-btn');
    submitCommentBtn.addEventListener('click', () => {
      const commentInput = postElement.querySelector('.comment-input');
      const content = commentInput.value.trim();
      if (content) {
        // Call API to add comment
        API.comments.create(post.id, content)
          .then(comment => {
            // Add the new comment to the UI
            const commentsContainer = postElement.querySelector('.comments-container');
            const commentElement = CommentController.createCommentElement(comment);
            commentsContainer.prepend(commentElement);
            commentInput.value = '';
          })
          .catch(error => {
            console.error('Error adding comment:', error);
            alert('Failed to add comment: ' + (error.message || 'Unknown error'));
          });
      }
    });

    return postElement;
  },

  // Handle image preview
  handleImagePreview: (event) => {
    const file = event.target.files[0];
    const preview = document.getElementById('imagePreview');
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
  },

  // Create new post
  createPost: async (event) => {
    event.preventDefault();

    const contentInput = document.getElementById('postContent');
    const titleInput = document.getElementById('postTitle');
    const imageInput = document.getElementById('postImage');
    const submitBtn = document.getElementById('submitPostBtn');

    if (!contentInput || !contentInput.value.trim()) {
      alert('Please enter some content for your post');
      return;
    }
    if (!titleInput || !titleInput.value.trim()) {
      alert('Please enter a post title');
      return;
    }

    // Disable submit button and show loading state
    submitBtn.disabled = true;
    const spinner = document.getElementById('postSpinner');
    const text = document.getElementById('postText');
    spinner.classList.remove('d-none');
    text.textContent = 'Posting...';

    try {
      const postData = {
        title: titleInput.value.trim(),
        content: contentInput.value.trim()
      };

      // Add file if selected
      if (imageInput && imageInput.files[0]) {
        postData.file = imageInput.files[0];
      }

      const newPost = await API.posts.create(postData);

      // Reset form
      contentInput.value = '';
      titleInput.value = '';
      if (imageInput) {
        imageInput.value = '';
        document.getElementById('imagePreview').classList.add('d-none');
      }

      // Add new post to the top of the feed
      const postsFeed = document.getElementById('postsFeed');
      if (postsFeed && newPost) {
        const postElement = FeedController.createPostElement(newPost);
        postsFeed.insertBefore(postElement, postsFeed.firstChild);
      }

      // Close modal if exists
      const createPostModal = document.getElementById('createPostModal');
      if (createPostModal) {
        const modal = bootstrap.Modal.getInstance(createPostModal);
        if (modal) modal.hide();
      }

    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post: ' + (error.message || 'Unknown error'));
    } finally {
      // Re-enable submit button
      submitBtn.disabled = false;
      spinner.classList.add('d-none');
      text.textContent = 'Post';
    }
  },

  // Load posts from users the current user is following
  loadFollowingPosts: async () => {
    if (FeedController.isLoading) return;
    FeedController.isLoading = true;
    FeedController.clearFollowingFeed();

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API.BASE_URL}/api/follows/${FeedController.currentUserId}/following`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Failed to fetch following list');
      const following = await res.json();
      const followingIds = following.map(f => f.following.id);

      if (followingIds.length === 0) {
        if (followingPostsLoader) followingPostsLoader.classList.add('d-none');
        followingPostsFeed.innerHTML = '<div class="text-center py-5 text-muted">You are not following anyone yet.</div>';
        FeedController.isLoading = false;
        return;
      }

      // Fetch posts for each following user (could be optimized with a backend endpoint)
      let allPosts = [];
      for (const userId of followingIds) {
        const postsRes = await API.posts.getByUserId(userId, 0, 5); // adjust page/size as needed
        if (postsRes && postsRes.posts) {
          allPosts = allPosts.concat(postsRes.posts);
        }
      }
      // Sort posts by date, descending
      allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      if (followingPostsLoader) followingPostsLoader.classList.add('d-none');
      if (allPosts.length === 0) {
        followingPostsFeed.innerHTML = '<div class="text-center py-5 text-muted">No posts from users you follow yet.</div>';
      } else {
        allPosts.forEach(post => {
          const postElement = FeedController.createPostElement(post);
          followingPostsFeed.appendChild(postElement);
        });
      }
    } catch (err) {
      if (followingPostsLoader) followingPostsLoader.classList.add('d-none');
      followingPostsFeed.innerHTML = '<div class="text-center py-5 text-danger">Failed to load following posts.</div>';
      console.error('Error loading following posts:', err);
    } finally {
      FeedController.isLoading = false;
    }
  },

  // Helper to clear following feed
  clearFollowingFeed: () => {
    const followingPostsFeed = document.getElementById('followingPostsFeed');
    const followingPostsLoader = document.getElementById('followingPostsLoader');
    if (followingPostsFeed) followingPostsFeed.innerHTML = '';
    if (followingPostsLoader) followingPostsLoader.classList.remove('d-none');
  },

  // Load recommended users
  loadRecommendedUsers: async () => {
    const recommendedUsersList = document.getElementById('recommendedUsersList');
    if (!recommendedUsersList) return;

    // Show loading skeleton
    recommendedUsersList.innerHTML = FeedController.createRecommendedUsersSkeleton();

    try {
      // Get following users to exclude them from recommendations
      const followingUsers = await FeedController.getFollowingUsers();
      const currentUserId = FeedController.currentUserId;
      
      // Create list of IDs to exclude (current user + following users)
      const excludeIds = [currentUserId];
      followingUsers.forEach(follow => {
        excludeIds.push(follow.following.id);
      });

      // Get random users from backend API
      const randomUsers = await API.users.getRandomUsersExcludingIds(excludeIds, 8);

      if (!randomUsers || randomUsers.length === 0) {
        recommendedUsersList.innerHTML = `
          <div class="text-center p-4">
            <i class="fas fa-users fa-2x text-muted mb-2"></i>
            <p class="text-muted mb-0">No more users to suggest</p>
          </div>
        `;
        return;
      }

      // Render recommended users
      const usersHtml = randomUsers.map(user => 
        FeedController.createRecommendedUserElement(user)
      ).join('');

      // Add "Show More" button if there are more users available
      const showMoreButton = randomUsers.length >= 8 ? `
        <div class="show-more-container">
          <button class="btn show-more-btn" onclick="FeedController.loadMoreRecommendedUsers()">
            <i class="fas fa-random"></i> Show More Random Users
          </button>
        </div>
      ` : '';

      recommendedUsersList.innerHTML = usersHtml + showMoreButton;

      // Set up follow buttons
      FeedController.setupFollowButtons();

    } catch (error) {
      console.error('Error loading recommended users:', error);
      recommendedUsersList.innerHTML = `
        <div class="text-center p-4">
          <i class="fas fa-exclamation-triangle fa-2x text-muted mb-2"></i>
          <p class="text-muted mb-0">Failed to load suggestions</p>
          <button class="btn btn-sm btn-outline-primary mt-2" onclick="FeedController.loadRecommendedUsers()">
            Try Again
          </button>
        </div>
      `;
    }
  },

  // Create recommended user element
  createRecommendedUserElement: (user) => {
    const initials = user.displayName ? 
      user.displayName.split(' ').map(n => n[0]).join('').toUpperCase() : 
      user.username.charAt(0).toUpperCase();
    
    const avatarHtml = renderAvatar(user, 40, 'recommended-user-avatar');
    return `
      <div class="recommended-user-item" data-user-id="${user.id}">
        ${avatarHtml}
        <div class="recommended-user-info">
          <div class="recommended-user-name">${user.displayName || user.username}</div>
          <div class="recommended-user-username">@${user.username}</div>
          <div class="recommended-user-followers">${user.followerCount || 0} followers</div>
        </div>
        <button class="btn btn-primary btn-sm follow-btn" data-user-id="${user.id}" onclick="FeedController.toggleFollow(${user.id}, this)">
          Follow
        </button>
      </div>
    `;
  },

  // Create loading skeleton for recommended users
  createRecommendedUsersSkeleton: () => {
    return Array(5).fill(0).map(() => `
      <div class="recommended-user-skeleton">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-text">
          <div class="skeleton-name"></div>
          <div class="skeleton-username"></div>
        </div>
        <div class="skeleton-button"></div>
      </div>
    `).join('');
  },

  // Setup follow buttons
  setupFollowButtons: () => {
    const followButtons = document.querySelectorAll('.follow-btn');
    followButtons.forEach(button => {
      const userId = button.getAttribute('data-user-id');
      // Check if already following
      FeedController.checkFollowStatus(userId, button);
    });
  },

  // Check follow status
  checkFollowStatus: async (userId, button) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API.BASE_URL}/api/follows/${FeedController.currentUserId}/is-following/${userId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const isFollowing = await response.json();
        if (isFollowing) {
          button.textContent = 'Following';
          button.classList.add('following');
          button.classList.remove('btn-primary');
        }
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  },

  // Toggle follow/unfollow
  toggleFollow: async (userId, button) => {
    try {
      const isFollowing = button.classList.contains('following');
      const token = localStorage.getItem('token');
      
      if (isFollowing) {
        // Unfollow
        const response = await fetch(`${API.BASE_URL}/api/follows/${FeedController.currentUserId}/unfollow/${userId}`, {
          method: 'DELETE',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (response.ok) {
          button.textContent = 'Follow';
          button.classList.remove('following');
          button.classList.add('btn-primary');
        }
      } else {
        // Follow
        const response = await fetch(`${API.BASE_URL}/api/follows/${FeedController.currentUserId}/follow/${userId}`, {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (response.ok) {
          button.textContent = 'Following';
          button.classList.add('following');
          button.classList.remove('btn-primary');
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert('Failed to update follow status. Please try again.');
    }
  },

  // Randomize recommended users
  randomizeRecommendedUsers: async () => {
    const recommendedUsersList = document.getElementById('recommendedUsersList');
    if (!recommendedUsersList) return;

    // Show loading state
    const randomizeBtn = document.getElementById('randomizeRecommendedBtn');
    if (randomizeBtn) {
      const originalContent = randomizeBtn.innerHTML;
      randomizeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      randomizeBtn.disabled = true;

      try {
        // Get following users to exclude them from recommendations
        const followingUsers = await FeedController.getFollowingUsers();
        const currentUserId = FeedController.currentUserId;
        
        // Create list of IDs to exclude (current user + following users)
        const excludeIds = [currentUserId];
        followingUsers.forEach(follow => {
          excludeIds.push(follow.following.id);
        });

        // Get random users from backend API
        const randomUsers = await API.users.getRandomUsersExcludingIds(excludeIds, 8);

        if (!randomUsers || randomUsers.length === 0) {
          recommendedUsersList.innerHTML = `
            <div class="text-center p-4">
              <i class="fas fa-users fa-2x text-muted mb-2"></i>
              <p class="text-muted mb-0">No more users to suggest</p>
            </div>
          `;
          return;
        }

        // Render new random users
        const usersHtml = randomUsers.map(user => 
          FeedController.createRecommendedUserElement(user)
        ).join('');

        // Add "Show More" button if there are more users available
        const showMoreButton = randomUsers.length >= 8 ? `
          <div class="show-more-container">
            <button class="btn show-more-btn" onclick="FeedController.loadMoreRecommendedUsers()">
              <i class="fas fa-random"></i> Show More Random Users
            </button>
          </div>
        ` : '';

        recommendedUsersList.innerHTML = usersHtml + showMoreButton;

        // Set up follow buttons
        FeedController.setupFollowButtons();

        // Show success feedback
        randomizeBtn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
          randomizeBtn.innerHTML = originalContent;
          randomizeBtn.disabled = false;
        }, 1000);

      } catch (error) {
        console.error('Error randomizing recommended users:', error);
        randomizeBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
        setTimeout(() => {
          randomizeBtn.innerHTML = originalContent;
          randomizeBtn.disabled = false;
        }, 2000);
      }
    }
  },

  // Get all users
  getAllUsers: async () => {
    try {
      return await API.users.getAll();
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  },

  // Get following users
  getFollowingUsers: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API.BASE_URL}/api/follows/${FeedController.currentUserId}/following`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch following users');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching following users:', error);
      return [];
    }
  },

  // Enhanced Fisher-Yates shuffle algorithm for better randomization
  shuffleArray: (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  // Load more random users
  loadMoreRecommendedUsers: async () => {
    const recommendedUsersList = document.getElementById('recommendedUsersList');
    if (!recommendedUsersList) return;

    // Show loading state
    const showMoreButton = recommendedUsersList.querySelector('button');
    if (showMoreButton) {
      showMoreButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
      showMoreButton.disabled = true;
    }

    try {
      // Get following users to exclude them from recommendations
      const followingUsers = await FeedController.getFollowingUsers();
      const currentUserId = FeedController.currentUserId;
      
      // Create list of IDs to exclude (current user + following users)
      const excludeIds = [currentUserId];
      followingUsers.forEach(follow => {
        excludeIds.push(follow.following.id);
      });

      // Get random users from backend API
      const randomUsers = await API.users.getRandomUsersExcludingIds(excludeIds, 8);

      if (!randomUsers || randomUsers.length === 0) {
        recommendedUsersList.innerHTML = `
          <div class="text-center p-4">
            <i class="fas fa-users fa-2x text-muted mb-2"></i>
            <p class="text-muted mb-0">No more users to suggest</p>
          </div>
        `;
        return;
      }

      // Render new random users
      const usersHtml = randomUsers.map(user => 
        FeedController.createRecommendedUserElement(user)
      ).join('');

      // Add "Show More" button if there are more users available
      const newShowMoreButton = randomUsers.length >= 8 ? `
        <div class="show-more-container">
          <button class="btn show-more-btn" onclick="FeedController.loadMoreRecommendedUsers()">
            <i class="fas fa-random"></i> Show More Random Users
          </button>
        </div>
      ` : '';

      recommendedUsersList.innerHTML = usersHtml + newShowMoreButton;

      // Set up follow buttons
      FeedController.setupFollowButtons();

    } catch (error) {
      console.error('Error loading more recommended users:', error);
      if (showMoreButton) {
        showMoreButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Try Again';
        showMoreButton.disabled = false;
      }
    }
  },
};

// Initialize feed when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  FeedController.init();

  const allTab = document.getElementById('all-tab');
  const followingTab = document.getElementById('following-tab');
  const allFeedPane = document.getElementById('allFeed');
  const followingFeedPane = document.getElementById('followingFeed');
  const postsFeed = document.getElementById('postsFeed');
  const followingPostsFeed = document.getElementById('followingPostsFeed');
  const postsLoader = document.getElementById('postsLoader');
  const followingPostsLoader = document.getElementById('followingPostsLoader');

  // Sidebar profile logging and mapping
  const sidebarUsername = document.getElementById('sidebarUsername');
  const sidebarFullName = document.getElementById('sidebarFullName');
  const sidebarAvatar = document.querySelector('.default-avatar.me-3');

  try {
    const profile = await API.profiles.getCurrentUserProfile();
    console.log('Sidebar profile API response:', profile);

    if (sidebarUsername) {
      // Map display name to username field
      const displayName = profile && profile.displayName ? profile.displayName : '';
      sidebarUsername.textContent = displayName || 'Display Name';
    }
    if (sidebarFullName) {
      // Map username to full name field
      const username = profile && profile.username ? profile.username : '';
      sidebarFullName.textContent = `@${username}`;
    }
    if (sidebarAvatar) {
      // Map profile picture URL
      if (profile && profile.profilePictureUrl) {
        sidebarAvatar.outerHTML = `<img src="${profile.profilePictureUrl}" class="rounded-circle me-3" width="64" height="64" alt="${profile.displayName || profile.username}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
      } else {
        // Fallback to default avatar with initials
        const initials = profile && profile.displayName 
          ? profile.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
          : (profile && profile.username ? profile.username.charAt(0).toUpperCase() : 'U');
        sidebarAvatar.innerHTML = initials;
        sidebarAvatar.style.display = 'flex';
      }
    }
    // Log what is being set
    console.log('Sidebar display name:', sidebarUsername ? sidebarUsername.textContent : null);
    console.log('Sidebar username:', sidebarFullName ? sidebarFullName.textContent : null);
    console.log('Profile picture URL:', profile ? profile.profilePictureUrl : null);
  } catch (err) {
    console.error('Failed to fetch sidebar profile:', err);
  }

  // Tab switching event listeners
  if (allTab) {
    allTab.addEventListener('click', () => {
      if (allFeedPane) allFeedPane.classList.add('show', 'active');
      if (followingFeedPane) followingFeedPane.classList.remove('show', 'active');
      // Optionally reload all posts
      // FeedController.loadPosts();
    });
  }
  if (followingTab) {
    followingTab.addEventListener('click', () => {
      if (allFeedPane) allFeedPane.classList.remove('show', 'active');
      if (followingFeedPane) followingFeedPane.classList.add('show', 'active');
      FeedController.loadFollowingPosts();
    });
  }
});

// Utility function to render user avatar
function renderAvatar(user, size = 40, extraClass = '') {
  if (user.profilePhoto) {
    return `<img src="${user.profilePhoto}" class="rounded-circle ${extraClass}" width="${size}" height="${size}" alt="${user.displayName || user.username}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
  } else {
    const initials = user.displayName
      ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
      : user.username.charAt(0).toUpperCase();
    return `<div class="default-avatar rounded-circle ${extraClass}" style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:bold;color:#6c757d;background-color:#e9ecef;">${initials}</div>`;
  }
}
