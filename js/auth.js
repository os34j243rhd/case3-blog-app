const Auth = {
    // Проверка доступности localStorage
    storageAvailable() {
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    },

    currentUser() {
        if (!this.storageAvailable()) return null;
        try {
            return JSON.parse(localStorage.getItem('blog_current_user') || 'null');
        } catch (e) {
            return null;
        }
    },

    users() {
        if (!this.storageAvailable()) return [];
        try {
            return JSON.parse(localStorage.getItem('blog_users') || '[]');
        } catch (e) {
            return [];
        }
    },

    saveUsers(users) {
        localStorage.setItem('blog_users', JSON.stringify(users));
    },

    register(username, password) {
        if (!this.storageAvailable()) {
            return { ok: false, error: 'localStorage недоступен. Откройте сайт через http:// (не file://) или разрешите хранение данных.' };
        }

        const users = this.users();
        if (users.find(u => u.username === username)) {
            return { ok: false, error: 'Пользователь с таким логином уже существует' };
        }

        // Простое хеширование (учебный вариант)
        const hash = btoa(unescape(encodeURIComponent(password)));
        users.push({ username, passwordHash: hash });
        this.saveUsers(users);

        // Проверяем, что записалось
        const check = this.users();
        if (!check.find(u => u.username === username)) {
            return { ok: false, error: 'Ошибка сохранения. Возможно, localStorage переполнен или заблокирован.' };
        }

        return { ok: true };
    },

    login(username, password) {
        if (!this.storageAvailable()) {
            return { ok: false, error: 'localStorage недоступен.' };
        }

        const users = this.users();
        const user = users.find(u => u.username === username);
        if (!user) return { ok: false, error: 'Пользователь не найден' };

        const hash = btoa(unescape(encodeURIComponent(password)));
        if (user.passwordHash !== hash) {
            return { ok: false, error: 'Неверный пароль' };
        }

        localStorage.setItem('blog_current_user', JSON.stringify({ username }));
        return { ok: true };
    },

    logout() {
        localStorage.removeItem('blog_current_user');
        window.location.href = 'index.html';
    },

    bindLoginForm() {
        const form = document.getElementById('login-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const errorEl = document.getElementById('login-error');
            errorEl.textContent = '';

            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value;

            const result = this.login(username, password);
            if (result.ok) {
                window.location.href = 'index.html';
            } else {
                errorEl.textContent = result.error;
            }
        });
    },

    bindRegisterForm() {
        const form = document.getElementById('register-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const errorEl = document.getElementById('reg-error');
            const successEl = document.getElementById('reg-success');
            errorEl.textContent = '';
            successEl.textContent = '';

            const username = document.getElementById('reg-username').value.trim();
            const password = document.getElementById('reg-password').value;
            const password2 = document.getElementById('reg-password2').value;

            if (username.length < 3) {
                errorEl.textContent = 'Логин должен быть минимум 3 символа';
                return;
            }
            if (password.length < 4) {
                errorEl.textContent = 'Пароль должен быть минимум 4 символа';
                return;
            }
            if (password !== password2) {
                errorEl.textContent = 'Пароли не совпадают';
                return;
            }

            const result = this.register(username, password);
            if (result.ok) {
                successEl.textContent = 'Аккаунт создан! Перенаправляем на вход...';
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
            } else {
                errorEl.textContent = result.error;
            }
        });
    },

    initHeader() {
        const user = this.currentUser();
        const info = document.getElementById('user-info');
        const logoutBtn = document.getElementById('logout-btn');

        if (user) {
            if (info) info.textContent = `👤 ${user.username}`;
            if (logoutBtn) {
                logoutBtn.style.display = 'inline-block';
                logoutBtn.onclick = () => this.logout();
            }
        } else {
            if (info) info.innerHTML = '<a href="login.html">Войти</a>';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    },

    requireAuth() {
        const user = this.currentUser();
        if (!user) {
            window.location.href = 'login.html';
            return null;
        }
        return user;
    }
};