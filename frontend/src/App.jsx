import { useEffect, useState } from "react";
import Header from './components/Header/Header';
import Navbar from './components/Navbar/Navbar';
import Profile from './components/Profile/Profile';
import Music from './components/Music/Music';
import Books from './components/Books/Books';
import React from 'react'
import './App.css';
import Dialogs from './components/Dialogs/Dialogs.jsx';
import NewPost from './components/NewPost/NewPost.jsx';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./components/Auth/Auth";
import { supabase } from "./helper/supabaseClient";

function App({ state, updateNewMessage, addMessage }) {
    const [loading, setLoading] = useState(true);
    const [navbarExpanded, setNavbarExpanded] = useState(true);
    const [user, setUser] = useState(null);

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

                            <Route
                                path="/login"
                                element={user ? <Navigate to="/" /> : <Auth />}
                            />

                            <Route
                                path="/"
                                element={
                                    user ? (
                                        <Profile user={user} state={state} />
                                    ) : (
                                        <Navigate to="/login" />
                                    )
                                }
                            />

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
                            <Route path="/posting" element={<NewPost />} />

                        </Routes>
                    </div>
                </div>
            </div>
        </Router>
    );
}

export default App;
