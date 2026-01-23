let rerenderEntireTree = () => {
    console.log("state changed");
};

let state = {
    auth: {
        isAuthenticated: false
    },

    profilePage: {
        user: {
            email: "",
            full_name: "",
            channel_id: "",
            bio: ""
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
        email: user.email,
        full_name: user.full_name,
        channel_id: user.channel_id,
        bio: user.bio || "",
    };

    rerenderEntireTree(state);
};

export const clearUser = () => {
    state.auth.isAuthenticated = false;

    state.profilePage.user = {
        email: "",
        full_name: "",
        channel_id: "",
        bio: ""
    };

    rerenderEntireTree(state);
};

export const subscriber = (observer) => {
    rerenderEntireTree = observer;
};

export default state;
