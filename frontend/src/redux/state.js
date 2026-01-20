let rerenderEntireTree = () => {
    console.log("state changed");
};

let state = {
    auth: {
        isAuthenticated: false,
        user: null
    },

    profilePage: {
        newPostText: "Hi from Flower!"
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
    state.auth.user = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name ?? "",
        telegram_channel: user.user_metadata?.telegram_channel ?? ""
    };
    rerenderEntireTree(state);
};

export const clearUser = () => {
    state.auth.isAuthenticated = false;
    state.auth.user = null;
    rerenderEntireTree(state);
};


export const subscriber = (observer) => {
    rerenderEntireTree = observer;
};

export default state;
