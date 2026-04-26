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
        full_name: user.user_metadata?.full_name || user.full_name || "",
        channel_id: user.user_metadata?.telegram_channel || user.channel_id || "",
        bio: user.user_metadata?.bio || user.bio || "",
        avatar_url: user.user_metadata?.avatar_url || user.avatar_url || DEFAULT_AVATAR
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

export const updateNewMessage = (text) => {
    state.messagesPage.newDialogMessage = text;
    rerenderEntireTree(state);
};

export const addMessage = () => {
    let newMessage = {
        id: state.messagesPage.messages.length + 1,
        message: state.messagesPage.newDialogMessage
    };
    state.messagesPage.messages.push(newMessage);
    state.messagesPage.newDialogMessage = '';
    rerenderEntireTree(state);
};

export default state;
