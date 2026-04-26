import state, { updateNewMessage, addMessage, subscriber, setUser, clearUser } from './state';

describe('redux state', () => {
    let stateUpdateCount = 0;
    const observer = jest.fn(() => {
        stateUpdateCount++;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        subscriber(observer);
        stateUpdateCount = 0;
        // Reset state manually if needed, but since it's a module we might need to be careful
        state.messagesPage.messages = [
            { id: 1, message: "hi there!" },
            { id: 2, message: "how are you?!" }
        ];
        state.messagesPage.newDialogMessage = "type...";
    });

    test('updateNewMessage should update newDialogMessage and notify observer', () => {
        const newMessage = 'Hello world';
        updateNewMessage(newMessage);
        
        expect(state.messagesPage.newDialogMessage).toBe(newMessage);
        expect(observer).toHaveBeenCalledTimes(1);
    });

    test('addMessage should add message to messages list and clear newDialogMessage', () => {
        const initialCount = state.messagesPage.messages.length;
        const newMessageText = 'New Test Message';
        updateNewMessage(newMessageText);
        observer.mockClear();

        addMessage();

        expect(state.messagesPage.messages.length).toBe(initialCount + 1);
        expect(state.messagesPage.messages[initialCount].message).toBe(newMessageText);
        expect(state.messagesPage.newDialogMessage).toBe('');
        expect(observer).toHaveBeenCalledTimes(1);
    });

    test('setUser should set authenticated user and notify observer', () => {
        const user = {
            email: 'test@example.com',
            full_name: 'Test User',
            channel_id: '123',
            bio: 'My bio',
            avatar_url: 'http://example.com/avatar.jpg'
        };

        setUser(user);

        expect(state.auth.isAuthenticated).toBe(true);
        expect(state.profilePage.user.email).toBe(user.email);
        expect(state.profilePage.user.full_name).toBe(user.full_name);
        expect(state.profilePage.user.avatar_url).toBe(user.avatar_url);
        expect(observer).toHaveBeenCalledTimes(1);
    });

    test('clearUser should reset user and notify observer', () => {
        setUser({ email: 'test@example.com' });
        observer.mockClear();

        clearUser();

        expect(state.auth.isAuthenticated).toBe(false);
        expect(state.profilePage.user.email).toBe("");
        expect(observer).toHaveBeenCalledTimes(1);
    });
});
