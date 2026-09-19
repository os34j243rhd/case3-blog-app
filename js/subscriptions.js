const Subscriptions = {
    all() {
        return JSON.parse(localStorage.getItem('blog_subscriptions') || '{}');
    },

    save(data) {
        localStorage.setItem('blog_subscriptions', JSON.stringify(data));
    },

    getSubscriptions(username) {
        const all = this.all();
        return all[username] || [];
    },

    isSubscribed(username, target) {
        return this.getSubscriptions(username).includes(target);
    },

    toggle(username, target) {
        if (username === target) return;
        const all = this.all();
        const subs = all[username] || [];
        if (subs.includes(target)) {
            all[username] = subs.filter(s => s !== target);
        } else {
            all[username] = [...subs, target];
        }
        this.save(all);
    },

    renderProfile() {
        const user = Auth.requireAuth();
        if (!user) return;

        document.getElementById('profile-username').textContent = user.username;

        // Мои посты
        const myPosts = Posts.all().filter(p => p.author === user.username).reverse();
        const myPostsEl = document.getElementById('my-posts');
        if (myPosts.length === 0) {
            myPostsEl.innerHTML = '<p>У вас пока нет постов.</p>';
        } else {
            myPostsEl.innerHTML = myPosts.map(p => `
                <div class="post">
                    <h3>${p.title}</h3>
                    <div class="meta">${new Date(p.createdAt).toLocaleString('ru-RU')}</div>
                    <p>${p.text}</p>
                </div>
            `).join('');
        }

        // Мои подписки
        const subs = this.getSubscriptions(user.username);
        document.getElementById('my-subscriptions').innerHTML = subs.length
            ? subs.map(s => `<span class="tag">${s}</span>`).join(' ')
            : '<p>Вы ни на кого не подписаны.</p>';

        // Подписчики
        const all = this.all();
        const followers = Object.keys(all).filter(u => all[u].includes(user.username));
        document.getElementById('my-followers').innerHTML = followers.length
            ? followers.map(f => `<span class="tag">${f}</span>`).join(' ')
            : '<p>У вас пока нет подписчиков.</p>';
    }
};