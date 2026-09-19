const Posts = {
    all() {
        return JSON.parse(localStorage.getItem('blog_posts') || '[]');
    },

    save(posts) {
        localStorage.setItem('blog_posts', JSON.stringify(posts));
    },

    create(post) {
        const posts = this.all();
        post.id = Date.now();
        post.author = Auth.currentUser().username;
        post.createdAt = new Date().toISOString();
        post.comments = [];
        posts.push(post);
        this.save(posts);
        return post;
    },

    update(id, changes) {
        const posts = this.all();
        const idx = posts.findIndex(p => p.id === id);
        if (idx === -1) return false;
        posts[idx] = { ...posts[idx], ...changes };
        this.save(posts);
        return true;
    },

    remove(id) {
        const posts = this.all().filter(p => p.id !== id);
        this.save(posts);
    },

    getById(id) {
        return this.all().find(p => p.id === id);
    },

    bindPostForm() {
        const form = document.getElementById('post-form');
        if (!form) return;

        const user = Auth.requireAuth();
        if (!user) return;

        // Редактирование
        const params = new URLSearchParams(window.location.search);
        const editId = params.get('edit');
        if (editId) {
            const post = this.getById(Number(editId));
            if (post && post.author === user.username) {
                document.getElementById('post-form-title').textContent = 'Редактировать пост';
                document.getElementById('post-id').value = post.id;
                document.getElementById('post-title').value = post.title;
                document.getElementById('post-text').value = post.text;
                document.getElementById('post-tags').value = (post.tags || []).join(', ');
                document.getElementById('post-public').checked = post.isPublic;
            }
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('post-id').value;
            const title = document.getElementById('post-title').value.trim();
            const text = document.getElementById('post-text').value.trim();
            const tagsRaw = document.getElementById('post-tags').value.trim();
            const isPublic = document.getElementById('post-public').checked;
            const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

            if (id) {
                this.update(Number(id), { title, text, tags, isPublic });
            } else {
                this.create({ title, text, tags, isPublic });
            }
            window.location.href = 'index.html';
        });
    },

    renderFeed() {
        const container = document.getElementById('posts-container');
        if (!container) return;

        const user = Auth.currentUser();
        const filter = document.getElementById('feed-filter')?.value || 'all';
        const tagFilter = document.getElementById('tag-filter')?.value || '';

        let posts = this.all().slice().reverse();

        // Фильтр по типу
        if (filter === 'my') {
            if (!user) { posts = []; }
            else posts = posts.filter(p => p.author === user.username);
        } else if (filter === 'subscriptions') {
            if (!user) { posts = []; }
            else {
                const subs = Subscriptions.getSubscriptions(user.username);
                posts = posts.filter(p => subs.includes(p.author));
            }
        } else {
            // all — только публичные, либо свои (включая скрытые)
            posts = posts.filter(p => p.isPublic || (user && p.author === user.username));
        }

        // Фильтр по тегу
        if (tagFilter) {
            posts = posts.filter(p => (p.tags || []).includes(tagFilter));
        }

        if (posts.length === 0) {
            container.innerHTML = '<p>Постов пока нет.</p>';
            return;
        }

        container.innerHTML = posts.map(p => this.renderPost(p, user)).join('');
        this.bindPostActions();
        Comments.bindCommentForms();
    },

    renderPost(post, currentUser) {
        const isOwner = currentUser && post.author === currentUser.username;
        const isSubscribed = currentUser && Subscriptions.isSubscribed(currentUser.username, post.author);
        const hiddenClass = post.isPublic ? '' : 'hidden-post';
        const hiddenLabel = post.isPublic ? '' : '<span class="tag">🔒 только по запросу</span>';

        const tags = (post.tags || []).map(t => `<span class="tag">#${t}</span>`).join(' ');

        const comments = (post.comments || []).map(c => `
            <div class="comment">
                <strong>${c.author}:</strong> ${c.text}
            </div>
        `).join('');

        return `
            <div class="post ${hiddenClass}" data-id="${post.id}">
                <h3>${post.title} ${hiddenLabel}</h3>
                <div class="meta">
                    Автор: ${post.author} · ${new Date(post.createdAt).toLocaleString('ru-RU')}
                </div>
                <div class="tags">${tags}</div>
                <p>${post.text}</p>
                <div class="actions">
                    ${isOwner ? `
                        <button class="edit-btn" data-id="${post.id}">Редактировать</button>
                        <button class="delete-btn delete" data-id="${post.id}">Удалить</button>
                    ` : ''}
                    ${currentUser && !isOwner ? `
                        <button class="subscribe-btn" data-author="${post.author}">
                            ${isSubscribed ? 'Отписаться' : 'Подписаться'}
                        </button>
                    ` : ''}
                </div>
                <div class="comments">
                    <strong>Комментарии:</strong>
                    ${comments || '<p>Пока нет комментариев.</p>'}
                    ${currentUser ? `
                        <form class="comment-form" data-post-id="${post.id}">
                            <input type="text" placeholder="Ваш комментарий..." required>
                            <button type="submit">Отправить</button>
                        </form>
                    ` : '<p><a href="login.html">Войдите</a>, чтобы комментировать.</p>'}
                </div>
            </div>
        `;
    },

    bindPostActions() {
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Удалить пост?')) {
                    this.remove(Number(btn.dataset.id));
                    this.renderFeed();
                }
            });
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                window.location.href = `post.html?edit=${btn.dataset.id}`;
            });
        });

        document.querySelectorAll('.subscribe-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const user = Auth.currentUser();
                if (!user) {
                    window.location.href = 'login.html';
                    return;
                }
                Subscriptions.toggle(user.username, btn.dataset.author);
                this.renderFeed();
            });
        });
    }
};