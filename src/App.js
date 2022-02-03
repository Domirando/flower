import Header from './components/Header'
import Navbar from './components/Navbar'
import './App.css';

function App() {
  return (
    <div className="app-wrapper">
        <Header />
        <Navbar />
        <div className="content bg-blue-400">
            <img src='https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=874&q=80' alt=''/>
            <div className="content-text">
                HI THERE!
            </div>
        </div>
    </div>
  );
}

export default App;