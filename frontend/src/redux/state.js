let rerenderEntireTree = () => {};

const DEFAULT_AVATAR =
    "https://static.vecteezy.com/system/resources/previews/002/608/327/non_2x/mobile-application-avatar-web-button-menu-digital-silhouette-style-icon-free-vector.jpg";

let state = {
    auth: {
        isAuthenticated: false
    },

    profilePage: {
        user: {
            id: "",
            email: "",
            full_name: "",
            channel_id: "",
            bio: "",
            interests: [],
            avatar_url: DEFAULT_AVATAR
        }
    },

};

// Accepts the user object returned by the Rust API
export const setUser = (user) => {
    if (!user) return;
    state.auth.isAuthenticated = true;
    state.profilePage.user = {
        id: user.id || "",
        email: user.email || "",
        full_name: user.full_name || "",
        channel_id: user.telegram_channel || "",
        bio: user.bio || "",
        interests: user.interests || [],
        avatar_url: user.avatar_url || DEFAULT_AVATAR,
    };
    rerenderEntireTree(state);
};

export const clearUser = () => {
    state.auth.isAuthenticated = false;
    state.profilePage.user = {
        id: "",
        email: "",
        full_name: "",
        channel_id: "",
        bio: "",
        interests: [],
        avatar_url: DEFAULT_AVATAR
    };
    rerenderEntireTree(state);
};

export const subscriber = (observer) => {
    rerenderEntireTree = observer;
};

export default state;
