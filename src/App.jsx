import Header from './components/Header/Header'
import Navbar from './components/Navbar/Navbar'
import Profile from './components/Profile/Profile'
import './App.css';
import Dialogs from './components/Dialogs/Dialogs.jsx'
import {
    BrowserRouter as Router,
    Routes,
    Route
} from "react-router-dom";

function App({ state, addPost, updateNewPosText }) {
    return (
        <Router>
            <div className="app-wrapper">
                <Header/>
                <Navbar/>
                <div className="app-wrapper-content">
                    <Routes>
                        <Route element={<Dialogs state={state.messagesPage} />} path='/dialogs'/>
                        <Route element={<Profile updateNewPosText={updateNewPosText} profilePage = {state.profilePage} addPost={addPost}/>} path='/'/>
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;