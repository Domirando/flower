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

function App({ messages, posts, dialogs }) {
    return (
        <Router>
            <div className="app-wrapper">
                <Header/>
                <Navbar/>
                <div className="app-wrapper-content">
                    <Routes>
                        <Route element={<Dialogs dialogs={dialogs} messages = {messages}/>} path='/dialogs'/>
                        <Route element={<Profile posts = {posts}/>} path='/'/>
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;