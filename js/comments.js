const Comments = {
    add(postId, author, text) {
        const posts = Posts.all();
        const post = posts.find(p => p.id === postId);
        if (!post) return;
        post.comments = post.comments || [];
        post.comments.push({
            author,
            text,
            createdAt: new Date().toISOString()
        });
        Posts.save(posts);
    },

    bindCommentForms() {
        document.querySelectorAll('.comment-form').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const user = Auth.currentUser();
                if (!user) {
                    window.location.href = 'login.html';
                    return;
                }
                const postId = Number(form.dataset.postId);
                const input = form.querySelector('input');
                const text = input.value.trim();
                if (!text) return;
                this.add(postId, user.username, text);
                Posts.renderFeed();
            });
        });
    }
};