const BASE_URL =
    process.env.REACT_APP_BACKEND_URL ||
    (typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:4000'
        : '');

const TOKEN_KEY = 'flower_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(path, options = {}) {
    const token = getToken();
    const headers = { ...options.headers };

    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
    }

    return res.json();
}

export const api = {
    // Auth
    register: (body) =>
        request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),

    login: (body) =>
        request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),

    getMe: () => request('/api/auth/me'),

    updateMe: (body) =>
        request('/api/auth/me', { method: 'PUT', body: JSON.stringify(body) }),

    uploadAvatar: (formData) =>
        request('/api/auth/avatar', { method: 'POST', body: formData }),

    // Posts
    getPosts: () => request('/api/posts'),

    createPost: (content) =>
        request('/api/posts', { method: 'POST', body: JSON.stringify({ content }) }),

    updatePost: (id, content) =>
        request(`/api/posts/${id}`, { method: 'PUT', body: JSON.stringify({ content }) }),

    deletePost: (id) =>
        request(`/api/posts/${id}`, { method: 'DELETE' }),

    // Books
    getBooks: () => request('/api/books'),

    uploadBook: (formData) =>
        request('/api/books', { method: 'POST', body: formData }),

    deleteBook: (id) =>
        request(`/api/books/${id}`, { method: 'DELETE' }),

    searchBooks: (q) =>
        request(`/api/books/search?q=${encodeURIComponent(q)}`),

    // News
    getNews: (interests) =>
        request(
            `/api/news${interests ? `?interests=${encodeURIComponent(interests)}` : ''}`
        ),

    // Telegram
    postToTelegram: (text) =>
        request('/api/telegram/post', { method: 'POST', body: JSON.stringify({ text }) }),
};
