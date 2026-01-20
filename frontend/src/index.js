import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import state, {
    subscriber,
} from "./redux/state";
import { initAuth } from "./helper/initAuth";

const rerenderEntireTree = (state) => {
    ReactDOM.render(
        <React.StrictMode>
            <App
                state={state}
            />
        </React.StrictMode>,
        document.getElementById("root")
    );
};

rerenderEntireTree(state);
subscriber(rerenderEntireTree);

initAuth();
