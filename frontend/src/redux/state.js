let rerenderEntireTree = () => {
    console.log("state changed");
};

const DEFAULT_AVATAR =
    "https://static.vecteezy.com/system/resources/previews/002/608/327/non_2x/mobile-application-avatar-web-button-menu-digital-silhouette-style-icon-free-vector.jpg";

let state = {
    auth: {
        isAuthenticated: false
    },

    profilePage: {
        user: {
            email: "",
            full_name: "",
            channel_id: "",
            bio: "",
            avatar_url: DEFAULT_AVATAR
        }
    },

    messagesPage: {
        messages: [
            { id: 1, message: "hi there!" },
            { id: 2, message: "how are you?!" }
        ],
        dialogs: [],
        newDialogMessage: "type..."
    }
};

export const setUser = (user) => {
    state.auth.isAuthenticated = true;

    state.profilePage.user = {
        email: user.email || "",
        full_name: user.full_name || "",
        channel_id: user.channel_id || "",
        bio: user.bio || "",
        avatar_url: user.avatar_url || DEFAULT_AVATAR
    };

    rerenderEntireTree(state);
};

export const clearUser = () => {
    state.auth.isAuthenticated = false;

    state.profilePage.user = {
        email: "",
        full_name: "",
        channel_id: "",
        bio: "",
        avatar_url: DEFAULT_AVATAR
    };

    rerenderEntireTree(state);
};

export const subscriber = (observer) => {
    rerenderEntireTree = observer;
};

export default state;
