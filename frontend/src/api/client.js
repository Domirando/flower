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

/**
 * Upload a file directly to R2 (or UploadThing) via presigned URL.
 * Returns the public URL of the uploaded file.
 * `onProgress(0-100)` is called during upload if provided.
 */
export async function uploadFileToR2(file, category, onProgress) {
    const contentType = file.type || 'application/octet-stream';

    // Get presigned URL from backend
    const { upload_url, key, public_url } = await request('/api/upload/r2-presign', {
        method: 'POST',
        body: JSON.stringify({ filename: file.name, content_type: contentType, category }),
    });

    // Upload directly to R2 via XHR for progress support
    await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', upload_url);
        xhr.setRequestHeader('Content-Type', contentType);
        if (onProgress) {
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
            };
        }
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`R2 upload failed: HTTP ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error('R2 upload failed (network error)'));
        xhr.send(file);
    });

    return { public_url, key };
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

    /**
     * channels: string[] — if omitted, backend uses the user's configured channels.
     * attachments: [{url, name, type}] — optional files to send to Telegram.
     */
    createPost: (content, channels, attachments) =>
        request('/api/posts', {
            method: 'POST',
            body: JSON.stringify({ content, channels, attachments }),
        }),

    updatePost: (id, content) =>
        request(`/api/posts/${id}`, { method: 'PUT', body: JSON.stringify({ content }) }),

    deletePost: (id) =>
        request(`/api/posts/${id}`, { method: 'DELETE' }),

    uploadPostImage: (formData) =>
        request('/api/posts/upload-image', { method: 'POST', body: formData }),

    // Books
    getBooks: () => request('/api/books'),

    /** Save book metadata after direct R2 upload. */
    saveBook: (body) =>
        request('/api/books', { method: 'POST', body: JSON.stringify(body) }),

    /** Multipart fallback — file goes through backend. */
    uploadBook: (formData) =>
        request('/api/books/upload', { method: 'POST', body: formData }),

    deleteBook: (id) =>
        request(`/api/books/${id}`, { method: 'DELETE' }),

    searchBooks: (q) =>
        request(`/api/books/search?q=${encodeURIComponent(q)}`),

    // News
    getNews: (interests) =>
        request(
            `/api/news${interests ? `?interests=${encodeURIComponent(interests)}` : ''}`
        ),

    // Telegram (manual post)
    postToTelegram: (text) =>
        request('/api/telegram/post', { method: 'POST', body: JSON.stringify({ text }) }),

    // Music – own songs
    getSongs: () => request('/api/music/songs'),

    /** Save song metadata after direct R2 upload. */
    saveSong: (body) =>
        request('/api/music/songs', { method: 'POST', body: JSON.stringify(body) }),

    /** Multipart fallback — file goes through backend. */
    uploadSong: (formData) =>
        request('/api/music/songs/upload', { method: 'POST', body: formData }),

    deleteSong: (id) =>
        request(`/api/music/songs/${id}`, { method: 'DELETE' }),

    // Upload helpers
    /** Get R2 presigned PUT URL for a direct browser upload. */
    presignR2: (filename, contentType, category) =>
        request('/api/upload/r2-presign', {
            method: 'POST',
            body: JSON.stringify({ filename, content_type: contentType, category }),
        }),

    /** Get UploadThing presigned upload credentials (requires UPLOADTHING_TOKEN on server). */
    presignUT: (filename, size, contentType) =>
        request('/api/upload/ut-presign', {
            method: 'POST',
            body: JSON.stringify({ filename, size, type: contentType }),
        }),

    // Music – Spotify
    getSpotifyAuthUrl: () => request('/api/music/spotify/auth-url'),

    getSpotifyStatus: () => request('/api/music/spotify/status'),

    getSpotifyToken: () => request('/api/music/spotify/token'),

    getSpotifyPlaylists: () => request('/api/music/spotify/playlists'),

    disconnectSpotify: () =>
        request('/api/music/spotify/disconnect', { method: 'POST' }),

    getPlaylistTracks: (playlistId) =>
        request(`/api/music/spotify/playlists/${playlistId}/tracks`),

    resolveTelegramChannel: (id) =>
        request(`/api/telegram/channel-name?id=${encodeURIComponent(id)}`),
};
