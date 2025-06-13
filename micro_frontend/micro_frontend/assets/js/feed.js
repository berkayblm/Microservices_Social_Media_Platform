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

    // Set up event listeners
    const submitPostBtn = document.getElementById('submitPostBtn');
    if (submitPostBtn) {
      submitPostBtn.addEventListener('click', FeedController.createPost);
    }

    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', FeedController.loadMorePosts);
    }

    // Set up infinite scroll
    window.addEventListener('scroll', FeedController.handleScroll);
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

      console.log('API Response:', response);

      // Hide loader
      const postsLoader = document.getElementById('postsLoader');
      if (postsLoader) {
        postsLoader.classList.add('d-none');
      }

      // If we got a valid response with posts
      if (response && response.posts && response.posts.length > 0) {
        // Update pagination information - fix the logic
        FeedController.hasMorePosts = pageToFetch < response.totalPages - 1;

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
          response.posts.forEach(post => {
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
  }

  ,

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
    postElement.innerHTML = `
       <div class="card-body">
         <div class="d-flex align-items-center mb-2">
           <img src="${post.author.profileImageUrl || '/assets/images/default-avatar.png'}"
                class="rounded-circle me-2" width="40" height="40" alt="${post.author.username}">
           <div>
             <h6 class="mb-0">${post.author.displayName || post.author.username}</h6>
             <small class="text-muted">@${post.author.username} · ${new Date(post.createdAt).toLocaleString()}</small>
           </div>
         </div>
         <p class="card-text">${post.content}</p>
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
  }
  ,

  // Create new post
  createPost: async (event) => {
    event.preventDefault();

    const contentInput = document.getElementById('postContent');
    const titleInput = document.getElementById('postTitle'); // Use the correct ID

    const imageInput = document.getElementById('postImage');
    const submitBtn = document.getElementById('submitPostBtn');

    if (!contentInput || !contentInput.value.trim()) {
      alert('Please enter some content for your post');
      return;
    }
    // Add validation
    if (!titleInput) {
      alert('Please enter a post title');
      return;
    }


    // Disable submit button and show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Posting...';

    try {
      const postData = {
        title: titleInput.value.trim(),
        content: contentInput.value.trim(),
        imageUrl: imageInput && imageInput.files[0] ? await FeedController.uploadImage(imageInput.files[0]) : null
      };

      const newPost = await API.posts.create(postData);

      // Reset form
      contentInput.value = '';
      if (imageInput) imageInput.value = '';

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
      submitBtn.textContent = 'Post';
    }
  },

  // Upload image helper
  uploadImage: async (file) => {
    // This is a placeholder - implement actual image upload logic
    // You'll need to set up a server endpoint to handle image uploads
    console.log('Image upload would happen here', file);
    return null;
  }
};

// Initialize feed when DOM is ready
document.addEventListener('DOMContentLoaded', FeedController.init);
