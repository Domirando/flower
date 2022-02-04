import Header from './components/Header/Header'
import Navbar from './components/Navbar/Navbar'
import Profile from './components/Profile/Profile'
import './App.css';
import Dialogs from './components/Dialogs/Dialogs.jsx'
import {BrowserRouter, Route} from 'react-router-dom'
import { Routes } from 'react-router'

function App() {
  return (
      <BrowserRouter>
            <div className="app-wrapper">
                <Header />
                <Navbar />
                <div className="app-wrapper-content">
                    <Route element={<Dialogs />} path='/dialogs'/>
                    {/*<Route element={<Profile />} path='/'/>*/}
                    {/*<Profile/>*/}
                </div>
            </div>
      </BrowserRouter>
  );
}

export default App;