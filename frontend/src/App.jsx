import { useEffect, useState } from "react";
import Header from "./components/Header/Header";
import Navbar from "./components/Navbar/Navbar";
import Profile from "./components/Profile/Profile";
import Music from "./components/Music/Music";
import Books from "./components/Books/Books";
import News from "./components/News/News";
import Dialogs from "./components/Dialogs/Dialogs.jsx";
import NewPost from "./components/NewPost/NewPost.jsx";
import Settings from "./components/Settings/Settings";
import Auth from "./components/Auth/Auth";
import About from "./components/About/About";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { api, clearToken, getToken } from "./api/client";
import { setUser, clearUser, subscriber } from "./redux/state";
import "./App.css";

function AppContent({ state, updateNewMessage, addMessage, user, loading, navbarExpanded, setNavbarExpanded }) {
    const location = useLocation();
    const isAuthPage = location.pathname === "/login";
    const showNavbar = user && !isAuthPage;

    if (loading) return <p>Loading...</p>;

    return (
        <div className="app-wrapper">
            <Header state={state} />
            <div className="app-body">
                {showNavbar && (
                    <Navbar
                        expanded={navbarExpanded}
                        setExpanded={setNavbarExpanded}
                        user={user}
                    />
                )}

                <div
                    className={`app-wrapper-content ${
                        showNavbar
                            ? navbarExpanded ? "content-expanded" : "content-collapsed"
                            : "content-full"
                    }`}
                >
                    <Routes>
                        <Route path="/login" element={user ? <Navigate to="/" /> : <Auth />} />
                        <Route path="/about" element={<About />} />
                        <Route
                            path="/settings"
                            element={user ? <Settings user={state.profilePage.user} /> : <Navigate to="/login" />}
                        />
                        <Route
                            path="/"
                            element={user ? <Profile state={state} /> : <Navigate to="/login" />}
                        />
                        <Route
                            path="/dialogs/*"
                            element={
                                user ? (
                                    <Dialogs
                                        updateNewMessage={updateNewMessage}
                                        addMessage={addMessage}
                                        messages={state.messagesPage}
                                        state={state.messagesPage}
                                    />
                                ) : <Navigate to="/login" />
                            }
                        />
                        <Route
                            path="/books"
                            element={user ? <Books /> : <Navigate to="/login" />}
                        />
                        <Route
                            path="/news"
                            element={<News user={state.profilePage.user} />}
                        />
                        <Route
                            path="/music"
                            element={user ? <Music /> : <Navigate to="/login" />}
                        />
                        <Route path="/posting" element={user ? <NewPost /> : <Navigate to="/login" />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
}

function App({ state, updateNewMessage, addMessage }) {
    const [loading, setLoading] = useState(true);
    const [user, setLocalUser] = useState(null);
    const [navbarExpanded, setNavbarExpanded] = useState(() => {
        const saved = localStorage.getItem("navbarExpanded");
        return saved ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem("navbarExpanded", JSON.stringify(navbarExpanded));
    }, [navbarExpanded]);

    useEffect(() => {
        subscriber((newState) => {
            if (newState.auth.isAuthenticated) {
                setLocalUser(newState.profilePage.user);
            } else {
                setLocalUser(null);
            }
        });
    }, []);

    useEffect(() => {
        const syncUser = async () => {
            if (!getToken()) {
                setLoading(false);
                return;
            }
            try {
                const userData = await api.getMe();
                setLocalUser(userData);
                setUser(userData);
            } catch {
                clearToken();
                clearUser();
            } finally {
                setLoading(false);
            }
        };

        syncUser();

        // Sync logout across tabs
        const onStorage = (e) => {
            if (e.key === 'flower_token' && !e.newValue) {
                setLocalUser(null);
                clearUser();
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    return (
        <Router>
            <AppContent
                state={state}
                updateNewMessage={updateNewMessage}
                addMessage={addMessage}
                user={user}
                loading={loading}
                navbarExpanded={navbarExpanded}
                setNavbarExpanded={setNavbarExpanded}
            />
        </Router>
    );
}

export default App;
