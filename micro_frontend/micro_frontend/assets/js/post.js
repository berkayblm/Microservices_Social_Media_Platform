/**
 * Post Controller for handling post-related actions
 */
const PostController = {
  // Toggle like on a post
  toggleLike: async (postId, likeButton) => {
    try {
      const response = await API.posts.toggleLike(postId);

      if (response) {
        // Update UI
        const likeCount = likeButton.querySelector('.like-count');
        likeCount.textContent = response.currentLikeCount;

        // Toggle button styling
        if (response.liked) {
          likeButton.classList.remove('btn-outline-primary');
          likeButton.classList.add('btn-primary');
          likeButton.querySelector('i').classList.remove('far');
          likeButton.querySelector('i').classList.add('fas');
        } else {
          likeButton.classList.add('btn-outline-primary');
          likeButton.classList.remove('btn-primary');
          likeButton.querySelector('i').classList.add('far');
          likeButton.querySelector('i').classList.remove('fas');
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      alert('Failed to like post: ' + (error.message || 'Unknown error'));
    }
  },

  // Toggle comments section
  toggleComments: async (postId, postElement) => {
    const commentsSection = postElement.querySelector('.comments-section');
    const commentsContainer = postElement.querySelector('.comments-container');

    // If already open, just toggle visibility
    if (commentsSection.classList.contains('d-none')) {
      commentsSection.classList.remove('d-none');

      // Check if comments are already loaded
      if (commentsContainer.childElementCount === 0) {
        commentsContainer.innerHTML = `
                    <div class="text-center py-3">
                        <div class="spinner-border spinner-border-sm text-primary" role="status">
                            <span class="visually-hidden">Loading comments...</span>
                        </div>
                        <p class="mt-2 small">Loading comments...</p>
                    </div>
                `;

        try {
          // Load comments
          const response = await API.comments.getByPostId(postId);

          // Clear loading state
          commentsContainer.innerHTML = '';

          if (response && response.comments && response.comments.length > 0) {
            // Render comments
            response.comments.forEach(comment => {
              const commentElement = CommentController.createCommentElement(comment);
              commentsContainer.appendChild(commentElement);
            });

            // Add pagination if needed
            if (response.totalPages > 1) {
              const paginationElement = document.createElement('div');
              paginationElement.className = 'text-center mt-3';
              paginationElement.innerHTML = `
                <button class="btn btn-sm btn-outline-primary load-more-comments" data-post-id="${postId}" data-page="1">
                  Load more comments
                </button>
              `;
              commentsContainer.appendChild(paginationElement);

              // Set up event listener for pagination
              paginationElement.querySelector('.load-more-comments').addEventListener('click', async (e) => {
                await PostController.loadMoreComments(postId, parseInt(e.target.dataset.page), commentsContainer, e.target);
              });
            }
          } else {
            // No comments
            commentsContainer.innerHTML = `
              <div class="text-center py-3">
                <p class="text-muted small">No comments yet. Be the first to comment!</p>
              </div>
            `;
          }
        } catch (error) {
          console.error('Error loading comments:', error);
          commentsContainer.innerHTML = `
            <div class="alert alert-danger small">
              Failed to load comments. Please try again.
            </div>
          `;
        }
      }
    } else {
      commentsSection.classList.add('d-none');
    }

    // Set up comment form submission if the form exists
    const commentForm = postElement.querySelector('.add-comment-form');
    if (commentForm) {
      const commentInput = postElement.querySelector('.comment-input');
      if (commentInput) {
        // Remove existing event listeners
        const newCommentForm = commentForm.cloneNode(true);
        commentForm.parentNode.replaceChild(newCommentForm, commentForm);

        // Add new event listener
        newCommentForm.addEventListener('submit', async (e) => {
          e.preventDefault();

          const content = newCommentForm.querySelector('.comment-input').value.trim();
          if (!content) return;

          const submitBtn = newCommentForm.querySelector('button[type="submit"]');
          const originalText = submitBtn.textContent;

          // Show loading state
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

          try {
            const newComment = await API.comments.create(postId, content);

            // Clear input
            newCommentForm.querySelector('.comment-input').value = '';

            // Add new comment to the list
            if (newComment) {
              // Remove "no comments" message if it exists
              const noCommentsMsg = commentsContainer.querySelector('.text-muted.small');
              if (noCommentsMsg && noCommentsMsg.textContent.includes('No comments yet')) {
                commentsContainer.innerHTML = '';
              }

              const commentElement = CommentController.createCommentElement(newComment);
              commentsContainer.insertBefore(commentElement, commentsContainer.firstChild);

              // Update comment count in the UI
              const commentCountEl = postElement.querySelector('.comment-count');
              if (commentCountEl) {
                const currentCount = parseInt(commentCountEl.textContent);
                commentCountEl.textContent = isNaN(currentCount) ? 1 : currentCount + 1;
              }
            }
          } catch (error) {
            console.error('Error adding comment:', error);
            alert('Failed to add comment: ' + (error.message || 'Unknown error'));
          } finally {
            // Restore button state
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }
        });
      }
    }
  },

  // Load more comments
  loadMoreComments: async (postId, page, commentsContainer, loadMoreBtn) => {
    if (!commentsContainer || !loadMoreBtn) return;

    // Show loading state
    loadMoreBtn.disabled = true;
    loadMoreBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';

    try {
      const response = await API.comments.getByPostId(postId, page);

      if (response && response.comments && response.comments.length > 0) {
        // Remove the load more button temporarily
        const pagination = loadMoreBtn.parentNode;
        pagination.remove();

        // Add new comments
        response.comments.forEach(comment => {
          const commentElement = CommentController.createCommentElement(comment);
          commentsContainer.appendChild(commentElement);
        });

        // Add updated pagination if needed
        if (page < response.totalPages - 1) {
          const paginationElement = document.createElement('div');
          paginationElement.className = 'text-center mt-3';
          paginationElement.innerHTML = `
            <button class="btn btn-sm btn-outline-primary load-more-comments" data-post-id="${postId}" data-page="${page + 1}">
              Load more comments
            </button>
          `;
          commentsContainer.appendChild(paginationElement);

          // Set up event listener for pagination
          paginationElement.querySelector('.load-more-comments').addEventListener('click', async (e) => {
            await PostController.loadMoreComments(postId, parseInt(e.target.dataset.page), commentsContainer, e.target);
          });
        }
      } else {
        loadMoreBtn.disabled = true;
        loadMoreBtn.textContent = 'No more comments';
      }
    } catch (error) {
      console.error('Error loading more comments:', error);
      loadMoreBtn.textContent = 'Failed to load comments';
    } finally {
      loadMoreBtn.disabled = false;
    }
  },

  // Edit post
  editPost: async (postId) => {
    try {
      const post = await API.posts.getById(postId);

      if (!post) {
        alert('Post not found');
        return;
      }

      // Create edit modal if it doesn't exist
      let editModal = document.getElementById('editPostModal');
      if (!editModal) {
        const modalHTML = `
          <div class="modal fade" id="editPostModal" tabindex="-1" aria-labelledby="editPostModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title" id="editPostModalLabel">Edit Post</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                  <form id="editPostForm">
                    <div class="mb-3">
                      <label for="editPostTitle" class="form-label">Title</label>
                      <input type="text" class="form-control" id="editPostTitle" required>
                    </div>
                    <div class="mb-3">
                      <label for="editPostContent" class="form-label">Content</label>
                      <textarea class="form-control" id="editPostContent" rows="4" required></textarea>
                    </div>
                    <div class="mb-3">
                      <label for="editPostImage" class="form-label">Media (optional)</label>
                      <input type="file" class="form-control" id="editPostImage" accept="image/*">
                      <div class="form-text">Supported formats: JPG, PNG, GIF</div>
                      <div id="editImagePreview" class="mt-2 d-none">
                        <img src="" alt="Preview" class="img-fluid rounded" style="max-height: 200px;">
                      </div>
                    </div>
                    <input type="hidden" id="editPostId">
                    <input type="hidden" id="editPostCurrentImageUrl">
                  </form>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                  <button type="button" class="btn btn-primary" id="savePostBtn">Save changes</button>
                </div>
              </div>
            </div>
          </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        editModal = document.getElementById('editPostModal');

        // Set up event listener for save button
        document.getElementById('savePostBtn').addEventListener('click', PostController.saveEditedPost);
        
        // Set up event listener for image preview
        document.getElementById('editPostImage').addEventListener('change', PostController.handleEditImagePreview);
      }

      // Fill in form values
      document.getElementById('editPostTitle').value = post.title;
      document.getElementById('editPostContent').value = post.content;
      document.getElementById('editPostId').value = postId;
      document.getElementById('editPostCurrentImageUrl').value = post.imageUrl || '';

      // Show current image if exists
      if (post.imageUrl) {
        const preview = document.getElementById('editImagePreview');
        const previewImg = preview.querySelector('img');
        previewImg.src = post.imageUrl;
        preview.classList.remove('d-none');
      }

      // Show modal
      const modal = new bootstrap.Modal(editModal);
      modal.show();

    } catch (error) {
      console.error('Error editing post:', error);
      alert('Failed to edit post: ' + (error.message || 'Unknown error'));
    }
  },

  // Save edited post
  saveEditedPost: async () => {
    const postId = document.getElementById('editPostId').value;
    const title = document.getElementById('editPostTitle').value.trim();
    const content = document.getElementById('editPostContent').value.trim();
    const imageInput = document.getElementById('editPostImage');
    const saveBtn = document.getElementById('savePostBtn');

    if (!title) {
      alert('Post title cannot be empty');
      return;
    }
    if (!content) {
      alert('Post content cannot be empty');
      return;
    }

    // Show loading state
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';

    try {
      const updateData = {
        title: title,
        content: content
      };

      // Add file if selected
      if (imageInput && imageInput.files[0]) {
        updateData.file = imageInput.files[0];
      }

      const updatedPost = await API.posts.update(postId, updateData);

      if (updatedPost) {
        // Update the post in the UI
        const postElement = document.querySelector(`.post-card[data-post-id="${postId}"]`);
        if (postElement) {
          postElement.querySelector('.card-title').textContent = updatedPost.title;
          postElement.querySelector('.card-text').textContent = updatedPost.content;
          
          // Update image if exists
          const imageContainer = postElement.querySelector('.post-image-container');
          const postImage = postElement.querySelector('.post-image');
          if (updatedPost.imageUrl) {
            if (imageContainer) {
              imageContainer.classList.remove('d-none');
              postImage.src = updatedPost.imageUrl;
            }
          } else {
            if (imageContainer) {
              imageContainer.classList.add('d-none');
            }
          }
        }

        // Close modal
        const editModal = document.getElementById('editPostModal');
        const modal = bootstrap.Modal.getInstance(editModal);
        if (modal) modal.hide();
      }
    } catch (error) {
      console.error('Error saving edited post:', error);
      alert('Failed to save post: ' + (error.message || 'Unknown error'));
    } finally {
      // Restore button state
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save changes';
    }
  },

  // Handle image preview for edit modal
  handleEditImagePreview: (event) => {
    const file = event.target.files[0];
    const preview = document.getElementById('editImagePreview');
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

  // Delete post
  deletePost: async (postId) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      await API.posts.delete(postId);

      // Remove post from UI
      const postElement = document.querySelector(`.post-card[data-post-id="${postId}"]`);
      if (postElement) {
        postElement.remove();
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post: ' + (error.message || 'Unknown error'));
    }
  }
};

/**
 * Comment Controller for handling comment operations
 */
const CommentController = {
  // Create comment element
  createCommentElement: (comment) => {
    const commentElement = document.createElement('div');
    commentElement.className = 'comment mb-2 p-2 border-bottom';
    commentElement.dataset.commentId = comment.id;

    commentElement.innerHTML = `
      <div class="d-flex">
        ${renderAvatar(comment.author, 32, 'me-2')}
        <div class="flex-grow-1">
          <div class="d-flex align-items-center">
            <h6 class="mb-0 me-2 fw-bold">${comment.username}</h6>
            <small class="text-muted">@${comment.username}</small>
            <small class="text-muted ms-auto">${new Date(comment.createdAt).toLocaleString()}</small>
          </div>
          <p class="mb-0 comment-text">${comment.content}</p>
          ${comment.isAuthor ?
      `<div class="mt-1 d-flex gap-2 ms-auto">
              <button class="btn btn-sm btn-outline-primary edit-comment-btn">
                <i class="fas fa-edit me-1"></i>Edit
              </button>
              <button class="btn btn-sm btn-outline-danger delete-comment-btn">
                <i class="fas fa-trash-alt me-1"></i>Delete
              </button>
            </div>` : ''
    }
        </div>
      </div>
    `;

    // Set up event listeners for comment actions
    const editBtn = commentElement.querySelector('.edit-comment-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        CommentController.editComment(comment.id, commentElement);
      });
    }

    const deleteBtn = commentElement.querySelector('.delete-comment-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        CommentController.deleteComment(comment.id, commentElement);
      });
    }

    return commentElement;
  },

  // Edit comment
  editComment: (commentId, commentElement) => {
    if (!commentElement) return;

    const commentText = commentElement.querySelector('.comment-text');
    const originalContent = commentText.textContent;

    // Replace text with textarea
    commentText.innerHTML = `
      <div class="input-group my-2">
        <textarea class="form-control form-control-sm edit-comment-input">${originalContent}</textarea>
        <button class="btn btn-sm btn-primary save-comment-btn">Save</button>
        <button class="btn btn-sm btn-outline-secondary cancel-comment-btn">Cancel</button>
      </div>
    `;

    // Add event listeners
    commentElement.querySelector('.save-comment-btn').addEventListener('click', async () => {
      const newContent = commentElement.querySelector('.edit-comment-input').value.trim();
      if (!newContent) return;

      try {
        const updatedComment = await API.comments.update(commentId, newContent);
        if (updatedComment) {
          commentText.textContent = updatedComment.content;
        }
      } catch (error) {
        console.error('Error updating comment:', error);
        alert('Failed to update comment: ' + (error.message || 'Unknown error'));
        commentText.textContent = originalContent;
      }
    });

    commentElement.querySelector('.cancel-comment-btn').addEventListener('click', () => {
      commentText.textContent = originalContent;
    });
  },

  // Delete comment
  deleteComment: async (commentId, commentElement) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await API.comments.delete(commentId);

      // Remove from UI
      if (commentElement) {
        commentElement.remove();

        // Update comment count
        const postElement = commentElement.closest('.post-card');
        if (postElement) {
          const commentCountEl = postElement.querySelector('.comment-count');
          if (commentCountEl) {
            const currentCount = parseInt(commentCountEl.textContent);
            if (!isNaN(currentCount) && currentCount > 0) {
              commentCountEl.textContent = currentCount - 1;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment: ' + (error.message || 'Unknown error'));
    }
  }
};

// Post Service for handling individual post operations
class PostService {
    constructor() {
        this.currentPost = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Load post details if on post-details page
        if (window.location.pathname.includes('post-details.html')) {
            const postId = new URLSearchParams(window.location.search).get('id');
            if (postId) {
                this.loadPostDetails(postId);
            } else {
                window.location.href = '/feed.html';
            }
        }
    }

    async loadPostDetails(postId) {
        try {
            const post = await API.posts.getById(postId);
            console.log('Post details API response:', post);
            this.currentPost = post;
            this.renderPostDetails(post);
            this.loadComments(postId);
        } catch (error) {
            console.error('Error loading post details:', error);
            this.showError('Failed to load post details. Please try again.');
        }
    }

    renderPostDetails(post) {
        // Update page title
        document.title = `${post.title} - SocialApp`;

        // Defensive DOM assignments
        const postTitleEl = document.getElementById('postTitle');
        if (postTitleEl) postTitleEl.textContent = post.title || '';

        const postContentEl = document.getElementById('postContent');
        if (postContentEl) postContentEl.textContent = post.content || '';

        const postAuthorEl = document.getElementById('postAuthor');
        if (postAuthorEl) postAuthorEl.textContent = (post.author && post.author.username) || post.username || 'Unknown';

        const postDateEl = document.getElementById('postDate');
        if (postDateEl) postDateEl.textContent = post.createdAt ? dayjs(post.createdAt).fromNow() : '';

        const likeCountEl = document.getElementById('likeCount');
        if (likeCountEl) likeCountEl.textContent = post.likeCount || 0;

        const commentCountEl = document.getElementById('commentCount');
        if (commentCountEl) commentCountEl.textContent = post.commentCount || 0;

        // Handle post image
        const imageContainer = document.getElementById('postImageContainer');
        const postImage = document.getElementById('postImage');
        if (imageContainer && postImage) {
            if (post.imageUrl) {
                imageContainer.classList.remove('d-none');
                postImage.src = post.imageUrl;
            } else {
                imageContainer.classList.add('d-none');
                postImage.src = '';
            }
        }

        // Set up post actions
        const postActions = document.getElementById('postActions');
        if (post.author.id === authService.getCurrentUser().id) {
            const editBtn = document.getElementById('editPostBtn');
            const deleteBtn = document.getElementById('deletePostBtn');

            editBtn.addEventListener('click', () => this.handleEditPost(post));
            deleteBtn.addEventListener('click', () => this.handleDeletePost(post.id));
        } else {
            postActions.remove();
        }

        // Set up like button
        const likeBtn = document.getElementById('likeBtn');
        likeBtn.addEventListener('click', () => this.handleLike(post.id, likeBtn));
    }

    async loadComments(postId) {
        try {
            const comments = await API.comments.getByPostId(postId);
            console.log('Comments API response:', comments);
            const container = document.getElementById('commentsContainer');
            container.innerHTML = '';

            comments.forEach(comment => {
                const commentElement = this.createCommentElement(comment);
                container.appendChild(commentElement);
            });
        } catch (error) {
            console.error('Error loading comments:', error);
            this.showError('Failed to load comments. Please try again.');
        }
    }

    createCommentElement(comment) {
        const template = document.getElementById('commentTemplate');
        const clone = template.content.cloneNode(true);

        clone.querySelector('.comment-username').textContent = comment.author.username;
        clone.querySelector('.comment-date').textContent = dayjs(comment.createdAt).fromNow();
        clone.querySelector('.comment-content').textContent = comment.content;

        // Set up edit/delete actions for comment author
        const commentActions = clone.querySelector('.comment-actions');
        if (comment.author.id === authService.getCurrentUser().id) {
            const editBtn = clone.querySelector('.edit-comment-btn');
            const deleteBtn = clone.querySelector('.delete-comment-btn');

            editBtn.addEventListener('click', () => this.handleEditComment(comment));
            deleteBtn.addEventListener('click', () => this.handleDeleteComment(comment.id, clone.querySelector('.comment-item')));
        } else {
            commentActions.remove();
        }

        return clone;
    }

    async handleLike(postId, likeBtn) {
        try {
            const response = await API.posts.like(postId);
            const likeCount = document.getElementById('likeCount');
            likeCount.textContent = response.likes;

            // Add animation class
            likeBtn.classList.add('animate-like');
            likeCount.classList.add('animate-like-count');

            // Remove animation class after it completes
            likeBtn.addEventListener('animationend', () => {
                likeBtn.classList.remove('animate-like');
            }, { once: true });
            likeCount.addEventListener('animationend', () => {
                likeCount.classList.remove('animate-like-count');
            }, { once: true });

        } catch (error) {
            console.error('Error liking post:', error);
            this.showError('Failed to like post. Please try again.');
        }
    }

    async handleAddComment(e) {
        e.preventDefault();
        const input = document.getElementById('commentInput');
        const content = input.value.trim();

        if (!content) return;

        try {
            const comment = await API.comments.create(this.currentPost.id, { content });
            const container = document.getElementById('commentsContainer');
            const commentElement = this.createCommentElement(comment);
            container.appendChild(commentElement);
            input.value = '';

            // Update comment count
            const commentCount = document.getElementById('commentCount');
            commentCount.textContent = parseInt(commentCount.textContent) + 1;
        } catch (error) {
            console.error('Error adding comment:', error);
            this.showError('Failed to add comment. Please try again.');
        }
    }

    async handleEditPost(post) {
        // Implement edit post functionality
        // This could open a modal with the post data for editing
    }

    async handleDeletePost(postId) {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            await API.posts.delete(postId);
            window.location.href = '/feed.html';
        } catch (error) {
            console.error('Error deleting post:', error);
            this.showError('Failed to delete post. Please try again.');
        }
    }

    async handleEditComment(comment) {
        // Implement edit comment functionality
        // This could convert the comment to an editable input
    }

    async handleDeleteComment(commentId, commentElement) {
        if (!confirm('Are you sure you want to delete this comment?')) return;

        try {
            await API.comments.delete(this.currentPost.id, commentId);
            commentElement.remove();

            // Update comment count
            const commentCount = document.getElementById('commentCount');
            commentCount.textContent = parseInt(commentCount.textContent) - 1;
        } catch (error) {
            console.error('Error deleting comment:', error);
            this.showError('Failed to delete comment. Please try again.');
        }
    }

    showError(message) {
        // Implement error display functionality
        // This could show a toast notification or alert
        alert(message);
    }
}

// Initialize post service
const postService = new PostService();

// Handle comment form submission
const commentForm = document.getElementById('commentForm');
if (commentForm) {
    commentForm.addEventListener('submit', (e) => postService.handleAddComment(e));
}

// Utility function to render user avatar
function renderAvatar(user, size = 40, extraClass = '') {
  if (user && user.profilePhoto) {
    return `<img src="${user.profilePhoto}" class="rounded-circle ${extraClass}" width="${size}" height="${size}" alt="${(user.displayName || user.username || 'User')}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
  } else {
    const initials = user && user.displayName
      ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
      : (user && user.username ? user.username.charAt(0).toUpperCase() : 'U');
    return `<div class="default-avatar rounded-circle ${extraClass}" style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:bold;color:#6c757d;background-color:#e9ecef;">${initials}</div>`;
  }
}
