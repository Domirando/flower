import styles from './Dialogs.module.css'
import stylesMessages from "./Messages/Messages.module.css";

import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";
import Wallpaper from "./Wallpaper";
import DialogItem from "./DialogItem/DialogItem";
import Message from "./Messages/Message";

const Dialogs = ({ state }) => {
    let dialogsElements = state.dialogs.map(dialog =>
        <DialogItem name={dialog.name} avatar={dialog.avatar} id={dialog.id}/>
    )
    let messagesElements = state.messages.map(message => <Message message={message.message}/>)
    return (
        <div className={styles.dialogs}>
            <div className={styles.dialogsItems}>
                {dialogsElements}
            </div>
            <div className={stylesMessages.messages}>
                {messagesElements}
            </div>
            <Routes>
                <Route element={<Wallpaper/>}/>
                {/*<Route element={<Messages/>} path='/dialogs/1'/>*/}
            </Routes>
        </div>
    )
}

export default Dialogs