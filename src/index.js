import React from 'react';
import './index.css';
import state, {subscriber} from './redux/state'
import ReactDOM from "react-dom";
import App from "./App";
import {addPost, updateNewPosText, addMessage, updateNewMessage} from "./redux/state";

let rerenderEntireTree = (state) => ReactDOM.render(
    <React.StrictMode>
        <App state={state} addMessage={addMessage} addPost={addPost} updateNewPosText={updateNewPosText} updateNewMessage={updateNewMessage}  />
    </React.StrictMode>,
    document.getElementById('root')
);
rerenderEntireTree(state)

subscriber(rerenderEntireTree)
