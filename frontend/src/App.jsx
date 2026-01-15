import { useEffect, useState } from "react";
import Header from './components/Header/Header';
import Navbar from './components/Navbar/Navbar';
import Profile from './components/Profile/Profile';
import Music from './components/Music/Music';
import Books from './components/Books/Books';
import './App.css';
import Dialogs from './components/Dialogs/Dialogs.jsx';
import News from './components/News/News.jsx';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login/Login";
import { supabase } from "./helper/supabaseClient";

function App({ state, updateNewMessage, addMessage }) {
    const [navbarExpanded, setNavbarExpanded] = useState(true);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Get authenticated user
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        };

        getUser();

        // Listen for auth changes (login / logout)
        const { data: authListener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
            }
        );

        return () => authListener.subscription.unsubscribe();
    }, []);

    if (loading) return <p>Loading...</p>;

    return (
        <Router>
            <div className="app-wrapper">
                <Header />

                <div className="app-body">
                    <Navbar
                        expanded={navbarExpanded}
                        setExpanded={setNavbarExpanded}
                    />

                    <div
                        className={`app-wrapper-content ${
                            navbarExpanded ? "content-expanded" : "content-collapsed"
                        }`}
                    >
                        <Routes>

                            {/* Login */}
                            <Route
                                path="/login"
                                element={user ? <Navigate to="/" /> : <Login />}
                            />

                            {/* Protected Profile */}
                            <Route
                                path="/"
                                element={
                                    user ? (
                                        <Profile user={user} />
                                    ) : (
                                        <Navigate to="/login" />
                                    )
                                }
                            />

                            {/* Other routes (optional protection) */}
                            <Route
                                path="/dialogs"
                                element={
                                    user ? (
                                        <Dialogs
                                            updateNewMessage={updateNewMessage}
                                            addMessage={addMessage}
                                            messages={state.messagesPage}
                                            state={state.messagesPage}
                                        />
                                    ) : (
                                        <Navigate to="/login" />
                                    )
                                }
                            />

                            <Route path="/books" element={<Books />} />
                            <Route path="/music" element={<Music />} />
                            <Route path="/news" element={<News />} />

                        </Routes>
                    </div>
                </div>
            </div>
        </Router>
    );
}

export default App;
