import styles from './Dialogs.module.css'
import {NavLink} from "react-router-dom";
import stylesMessages from "./Messages/Messages.module.css";

import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";
import Wallpaper from "./Wallpaper";
import DialogItem from "./DialogItem/DialogItem";
import Message from "./Messages/Message";


const Dialogs = ({ dialogs, messages }) => {
    // let dialogs = [
    //     {id: 1, name: 'Tommy'},
    //     {id: 2, name: 'Sara'},
    //     {id: 2, name: 'Maisie'},
    //     {id: 3, name: 'Sam'},
    //     {id: 4, name: 'Andrew'},
    //     {id: 5, name: 'Thomas'},
    //     {id: 6, name: 'Simon'},
    //     {id: 7, name: 'Tina'},
    //     {id: 8, name: 'Simpson'}
    // ]
    let dialogsElements = dialogs.map(dialog =>
        <DialogItem name={dialog.name} id={dialog.id}/>
    )
    // let messages = [
    //     {id: 1, message: 'hi there!'},
    //     {id: 2, message: 'how are you?!'},
    //     {id: 2, message: 'what are you doing?'},
    //     {id: 3, message: 'what about education?'},
    //     {id: 4, message: 'happy to listen!'},
    //     {id: 4, message: 'Yo!'}
    // ]
    let messagesElements = messages.map(message => <Message message={message.message}/>)
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