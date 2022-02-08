import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

let messages = [
    {id: 1, message: 'hi there!'},
    {id: 2, message: 'how are you?!'},
    {id: 2, message: 'what are you doing?'},
    {id: 3, message: 'what about education?'},
    {id: 4, message: 'happy to listen!'},
    {id: 4, message: 'Yo!'}
]
let dialogs = [
    {id: 1, name: 'Tommy'},
    {id: 2, name: 'Sara'},
    {id: 2, name: 'Maisie'},
    {id: 3, name: 'Sam'},
    {id: 4, name: 'Andrew'},
    {id: 5, name: 'Thomas'},
    {id: 6, name: 'Simon'},
    {id: 7, name: 'Tina'},
    {id: 8, name: 'Simpson'}
]
let posts = [
    {id: 1, title: 'Organizator?!, Web Hackathon', likesCount: 5, dislikesCount: 0},
    {id: 2, title: 'Hello!, Global Digits!!!',  likesCount: 8, dislikesCount: 1},
    {id: 3, title: 'Hello!, Digital Panda!!!',  likesCount: 16, dislikesCount: 0},
    {id: 4, title: 'Hello!, Digital Panda!!!',  likesCount: 16, dislikesCount: 0},
]

ReactDOM.render(
  <React.StrictMode>
    <App messages={messages} dialogs={dialogs} posts={posts} />
  </React.StrictMode>,
  document.getElementById('root')
);
