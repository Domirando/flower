import {useEffect, useState} from "react";
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
import {BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom";
import {supabase} from "./helper/supabaseClient";
import {setUser} from "./redux/state";
import "./App.css";

function App({state, updateNewMessage, addMessage}) {
    const [loading, setLoading] = useState(true);
    const [navbarExpanded, setNavbarExpanded] = useState(() => {
        const saved = localStorage.getItem("navbarExpanded");
        return saved ? JSON.parse(saved) : true;
    });

    const [user, setLocalUser] = useState(null);

    useEffect(() => {
        localStorage.setItem("navbarExpanded", JSON.stringify(navbarExpanded));
    }, [navbarExpanded]);

    useEffect(() => {
        const syncUser = async () => {
            const { data, error } = await supabase.auth.getUser();
            error?console.log(error):console.log("sync user", data);
            const user = data?.user ?? null;
            console.log("metadata", user?.user_metadata);

            console.log("uuser", user);
            if (user) {
                setLocalUser(user);      // local (routing)
                setUser(user);           // global (state.js)
            } else {
                setLocalUser(null);
                setUser({
                    email: "",
                    full_name: "",
                    channel_id: "",
                    bio: ""
                });
            }

            setLoading(false);
        };

        syncUser();

        const {data: authListener} = supabase.auth.onAuthStateChange(
            (_event, session) => {
                const user = session?.user ?? null;

                if (user) {
                    setLocalUser(user);
                    setUser(user);
                } else {
                    setLocalUser(null);
                    setUser({
                        email: "",
                        full_name: "",
                        channel_id: "",
                        bio: ""
                    });
                }
            }
        );

        return () => authListener.subscription.unsubscribe();
    }, []);

    if (loading) return <p>Loading...</p>;

    return (
        <Router>
            <div className="app-wrapper">
                <Header state={state}/>
                <div className="app-body">
                    <Navbar
                        expanded={navbarExpanded}
                        setExpanded={setNavbarExpanded}
                        user={user}
                    />

                    <div
                        className={`app-wrapper-content ${
                            navbarExpanded ? "content-expanded" : "content-collapsed"
                        }`}
                    >
                        <Routes>
                            <Route path="/login" element={user ? <Navigate to="/settings" /> : <Auth/>}/>
                            <Route
                                path="/settings"
                                element={
                                    user ? (
                                        <Settings user={state.profilePage.user} />
                                    ) : (
                                        <Navigate to="/login" />
                                    )
                                }
                            />

                            <Route
                                path="/"
                                element={
                                    user ? (
                                        <Profile state={state}/>
                                    ) : (
                                        <Navigate to="/login"/>
                                    )
                                }
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
                                    ) : (
                                        <Navigate to="/login"/>
                                    )
                                }
                            />

                            <Route
                                path="/books"
                                element={
                                    user ? (
                                        <Books />
                                    ) : (
                                        <Navigate to="/login" />
                                    )
                                }
                            />
                            <Route
                                path="/news"
                                element={
                                    user ? (
                                        <News />
                                    ) : (
                                        <Navigate to="/login" />
                                    )
                                }
                            />
                            <Route
                                path="/music"
                                element={
                                    user ? (
                                        <Music />
                                    ) : (
                                        <Navigate to="/login" />
                                    )
                                }
                            />
                            <Route path="/posting" element={<NewPost/>}/>
                        </Routes>
                    </div>
                </div>
            </div>
        </Router>
    );
}

export default App;