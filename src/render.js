import ReactDOM from "react-dom";
import React from "react";
import App from "./App";
import {addPost, updateNewPosText, addMessage, updateNewMessage} from "./redux/state";

export let rerenderEntireTree = (state) => ReactDOM.render(
    <React.StrictMode>
        <App state={state} addMessage={addMessage} addPost={addPost} updateNewPosText={updateNewPosText} updateNewMessage={updateNewMessage}  />
    </React.StrictMode>,
    document.getElementById('root')
);