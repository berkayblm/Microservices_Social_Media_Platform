/**
 * Comment Controller for handling comment-related actions
 */
const CommentController = {
  currentPage: 0,
  pageSize: 10,
  hasMoreComments: true,

  // Load comments for a post
  loadPostComments: async (postId, append = false) => {
    const commentsContainer = document.getElementById('commentsContainer');
    const commentsLoader = document.getElementById('commentsLoader');
    const loadMoreCommentsContainer = document.getElementById('loadMoreCommentsContainer');

    if (!commentsContainer || !postId) return;

    if (!append) {
      CommentController.currentPage = 0;
      commentsContainer.innerHTML = '';
      commentsLoader.classList.remove('d-none');
      loadMoreCommentsContainer.classList.add('d-none');
    }

    try {
      const response = await API.comments.getByPostId(postId, CommentController.currentPage, CommentController.pageSize);

      if (!append) {
        commentsLoader.classList.add('d-none');
      }

      // Handle empty response
      if (!response || !response.content || response.content.length === 0) {
        if (!append) {
          commentsContainer.innerHTML = `
                        <div class="text-center py-3">
                            <p class="text-muted">No comments yet. Be the first to comment!</p>
                        </div>
                    `;
        }

        CommentController.hasMoreComments = false;
        loadMoreCommentsContainer.classList.add('d-none');
        return;
      }

      // Render comments
      response.content.forEach(comment => {
        const commentElement = CommentController.createCommentElement(comment);
        commentsContainer.appendChild(commentElement);
      });

      // Update pagination state
      CommentController.hasMoreComments = !response.last;
      loadMoreCommentsContainer.classList.toggle('d-none', !CommentController.hasMoreComments);

      // Update current page
      CommentController.currentPage++;

      // Update comment count
      document.getElementById('commentCount').textContent = response.totalElements;

    } catch (error) {
      console.error('Error loading comments:', error);

      if (!append) {
        commentsLoader.classList.add('d-none');
        commentsContainer.innerHTML = `
                    <div class="alert alert-danger">
                        Failed to load comments. Please try again.
                    </div>
                `;
      }
    }
  },

  // Load more comments
  loadMoreComments: async (postId) => {
    if (!CommentController.hasMoreComments) return;

    const loadMoreBtn = document.getElementById('loadMoreCommentsBtn');
    const loadMoreSpinner = document.getElementById('loadMoreCommentsSpinner');
    const loadMoreText = document.getElementById('loadMoreCommentsText');

    loadMoreBtn.disabled = true;
    loadMoreSpinner.classList.remove('d-none');
    loadMoreText.textContent = 'Loading...';

    try {
      await CommentController.loadPostComments(postId, true);
    } finally {
      loadMoreBtn.disabled = false;
      loadMoreSpinner.classList.add('d-none');
      loadMoreText.textContent = 'Load More Comments';
    }
  },

  // Add a comment to a post
  addComment: async (postId, content) => {
    if (!content.trim()) return null;

    try {
      return await API.comments.create(postId, content);
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  // Update a comment
  updateComment: async (commentId, content) => {
    if (!content.trim()) return null;

    try {
      return await API.comments.update(commentId, content);
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  },

  // Delete a comment
  deleteComment: async (commentId) => {
    try {
      await API.comments.delete(commentId);
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },

  // Create comment DOM element from comment data
  createCommentElement: (comment) => {
    // Clone comment template
    const template = document.getElementById('commentTemplate');
    const commentElement = template.content.cloneNode(true).querySelector('.comment-item');

    // Set comment data
    commentElement.dataset.commentId = comment.id;

    // Set comment author info
    commentElement.querySelector('.comment-username').textContent = comment.username;

    // Set comment date
    const commentDate = new Date(comment.createdAt);
    commentElement.querySelector('.comment-date').textContent = dayjs(commentDate).fromNow();

    // Set comment content
    commentElement.querySelector('.comment-content').textContent = comment.content;

    // Show/hide edit options based on ownership
    const currentUser = AuthService.getCurrentUser();
    const isOwner = currentUser && comment.userId === currentUser.id;
    const commentActions = commentElement.querySelector('.comment-actions');

    if (!isOwner) {
      commentActions.classList.add('d-none');
    } else {
      // Set up edit and delete buttons
      const editBtn = commentElement.querySelector('.edit-comment-btn');
      const deleteBtn = commentElement.querySelector('.delete-comment-btn');

      editBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const newContent = prompt('Edit your comment:', comment.content);
        if (newContent !== null && newContent.trim() !== '') {
          CommentController.handleEditComment(comment.id, newContent, commentElement);
        }
      });

      deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to delete this comment?')) {
          CommentController.handleDeleteComment(comment.id, commentElement);
        }
      });
    }

    return commentElement;
  },

  // Handle edit comment UI and API call
  handleEditComment: async (commentId, content, commentElement) => {
    try {
      const updatedComment = await CommentController.updateComment(commentId, content);

      if (updatedComment) {
        // Update content in UI
        commentElement.querySelector('.comment-content').textContent = updatedComment.content;

        // Update date
        commentElement.querySelector('.comment-date').textContent = dayjs(new Date(updatedComment.updatedAt)).fromNow();
      }
    } catch (error) {
      alert('Failed to update comment: ' + (error.message || 'Unknown error'));
    }
  },

  // Handle delete comment UI and API call
  handleDeleteComment: async (commentId, commentElement) => {
    try {
      const success = await CommentController.deleteComment(commentId);

      if (success) {
        // Remove from UI
        commentElement.remove();

        // Update comment count
        const commentCount = document.getElementById('commentCount');
        const currentCount = parseInt(commentCount.textContent);
        commentCount.textContent = Math.max(0, currentCount - 1);

        // Check if comments container is now empty
        const commentsContainer = document.getElementById('commentsContainer');
        if (commentsContainer && commentsContainer.children.length === 0) {
          commentsContainer.innerHTML = `
                        <div class="text-center py-3">
                            <p class="text-muted">No comments yet. Be the first to comment!</p>
                        </div>
                    `;
        }
      }
    } catch (error) {
      alert('Failed to delete comment: ' + (error.message || 'Unknown error'));
    }
  }
};

// Initialize comment form on post details page
document.addEventListener('DOMContentLoaded', () => {
  const addCommentForm = document.getElementById('addCommentForm');
  if (addCommentForm) {
    // Get post ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (!postId) return;

    // Set up form submission
    addCommentForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const commentInput = document.getElementById('commentInput');
      const content = commentInput.value.trim();

      if (!content) return;

      const addCommentBtn = document.getElementById('addCommentBtn');
      const commentSpinner = document.getElementById('commentSpinner');
      const commentText = document.getElementById('commentText');

      addCommentBtn.disabled = true;
      commentSpinner.classList.remove('d-none');
      commentText.textContent = 'Posting...';

      try {
        const newComment = await CommentController.addComment(postId, content);

        // Clear input
        commentInput.value = '';

        // Add new comment to UI
        const commentsContainer = document.getElementById('commentsContainer');

        // If there was a "no comments" message, remove it
        if (commentsContainer.querySelector('.text-muted')) {
          commentsContainer.innerHTML = '';
        }

        // Add the new comment
        const commentElement = CommentController.createCommentElement(newComment);
        commentsContainer.prepend(commentElement);

        // Update comment count
        const commentCount = document.getElementById('commentCount');
        const currentCount = parseInt(commentCount.textContent);
        commentCount.textContent = currentCount + 1;

      } catch (error) {
        console.error('Error posting comment:', error);
        alert('Failed to post comment: ' + (error.message || 'Unknown error'));
      } finally {
        addCommentBtn.disabled = false;
        commentSpinner.classList.add('d-none');
        commentText.textContent = 'Post';
      }
    });

    // Set up load more comments button
    const loadMoreCommentsBtn = document.getElementById('loadMoreCommentsBtn');
    if (loadMoreCommentsBtn) {
      loadMoreCommentsBtn.addEventListener('click', () => CommentController.loadMoreComments(postId));
    }

    // Load post details
    PostController.loadPostDetails(postId);
  }
});
