import ReactDOM from "react-dom";
import React from "react";
import App from "./App";
import {addPost, updateNewPosText} from "./redux/state";

export let rerenderEntireTree = (state) => ReactDOM.render(
    <React.StrictMode>
        <App state={state} addPost={addPost} updateNewPosText={updateNewPosText}  />
    </React.StrictMode>,
    document.getElementById('root')
);