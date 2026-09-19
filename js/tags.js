const Tags = {
    getAllTags() {
        const posts = Posts.all();
        const set = new Set();
        posts.forEach(p => (p.tags || []).forEach(t => set.add(t)));
        return Array.from(set).sort();
    },

    fillTagFilter() {
        const select = document.getElementById('tag-filter');
        if (!select) return;
        const tags = this.getAllTags();
        select.innerHTML = '<option value="">Все теги</option>' +
            tags.map(t => `<option value="${t}">#${t}</option>`).join('');

        select.addEventListener('change', () => Posts.renderFeed());
    }
};

// Фильтр ленты
document.addEventListener('DOMContentLoaded', () => {
    const filter = document.getElementById('feed-filter');
    if (filter) filter.addEventListener('change', () => Posts.renderFeed());
});