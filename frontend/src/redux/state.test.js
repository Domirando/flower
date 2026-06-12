import state, { subscriber, setUser, clearUser } from './state';

describe('redux state', () => {
    const observer = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        subscriber(observer);
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
