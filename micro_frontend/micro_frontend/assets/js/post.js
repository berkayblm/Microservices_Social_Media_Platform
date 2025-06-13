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

          if (response && response.content && response.content.length > 0) {
            // Render comments
            response.content.forEach(comment => {
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

    // Set up comment form submission
    const commentForm = postElement.querySelector('.add-comment-form');
    const commentInput = postElement.querySelector('.comment-input');

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
  },

  // Load more comments
  loadMoreComments: async (postId, page, commentsContainer, loadMoreBtn) => {
    if (!commentsContainer || !loadMoreBtn) return;

    // Show loading state
    loadMoreBtn.disabled = true;
    loadMoreBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';

    try {
      const response = await API.comments.getByPostId(postId, page);

      if (response && response.content && response.content.length > 0) {
        // Remove the load more button temporarily
        const pagination = loadMoreBtn.parentNode;
        pagination.remove();

        // Add new comments
        response.content.forEach(comment => {
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
            <div class="modal-dialog">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title" id="editPostModalLabel">Edit Post</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                  <form id="editPostForm">
                    <div class="mb-3">
                      <textarea class="form-control" id="editPostContent" rows="4" required></textarea>
                    </div>
                    <input type="hidden" id="editPostId">
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
      }

      // Fill in form values
      document.getElementById('editPostContent').value = post.content;
      document.getElementById('editPostId').value = postId;

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
    const content = document.getElementById('editPostContent').value.trim();
    const saveBtn = document.getElementById('savePostBtn');

    if (!content) {
      alert('Post content cannot be empty');
      return;
    }

    // Show loading state
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';

    try {
      const updatedPost = await API.posts.update(postId, { content });

      if (updatedPost) {
        // Update the post in the UI
        const postElement = document.querySelector(`.post-card[data-post-id="${postId}"]`);
        if (postElement) {
          postElement.querySelector('.card-text').textContent = updatedPost.content;
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
        <img src="${comment.author.profileImage || '/img/default-avatar.png'}" class="rounded-circle me-2" width="24" height="24" alt="${comment.author.username}">
        <div class="flex-grow-1">
          <div class="d-flex align-items-center">
            <h6 class="mb-0 me-2 fw-bold">${comment.author.name || comment.author.username}</h6>
            <small class="text-muted">@${comment.author.username}</small>
            <small class="text-muted ms-auto">${new Date(comment.createdAt).toLocaleString()}</small>
          </div>
          <p class="mb-0 comment-text">${comment.content}</p>
          ${comment.author.id === FeedController.currentUserId ?
      `<div class="mt-1 d-flex">
              <button class="btn btn-sm btn-link p-0 me-3 edit-comment-btn">Edit</button>
              <button class="btn btn-sm btn-link p-0 text-danger delete-comment-btn">Delete</button>
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
