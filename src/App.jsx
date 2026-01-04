import { useState } from "react";
import Header from './components/Header/Header'
import Navbar from './components/Navbar/Navbar'
import Profile from './components/Profile/Profile'
import Music from './components/Music/Music'
import Books from './components/Books/Books'
import './App.css';
import Dialogs from './components/Dialogs/Dialogs.jsx'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App({ state, addPost, updateNewPosText, updateNewMessage, addMessage }) {

    const [navbarExpanded, setNavbarExpanded] = useState(true);

    return (
        <Router>
            <div className="app-wrapper">
                <Header/>

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
                                path="/dialogs"
                                element={
                                    <Dialogs
                                        updateNewMessage={updateNewMessage}
                                        addMessage={addMessage}
                                        messages={state.messagesPage}
                                        state={state.messagesPage}
                                    />
                                }
                            />
                            <Route
                                path="/books"
                                element={
                                    <Books/>
                                }
                            />
                            <Route
                                path="/"
                                element={
                                    <Profile
                                        updateNewPosText={updateNewPosText}
                                        profilePage={state.profilePage}
                                        addPost={addPost}
                                    />
                                }
                            />
                            <Route
                                path="/music"
                                element={
                                    <Music/>
                                }
                            />
                        </Routes>
                    </div>
                </div>
            </div>
        </Router>
    );
}

export default App;
