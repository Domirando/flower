import styles from './Dialogs.module.css'
import stylesMessages from "./Messages/Messages.module.css";
import {Send} from '@material-ui/icons';
import React from 'react'
import {
    Routes,
    Route
} from "react-router-dom";
import Wallpaper from "./Wallpaper";
import DialogItem from "./DialogItem/DialogItem";
import Message from "./Messages/Message";

const Dialogs = ({state, updateNewMessage, addMessage, messages}) => {
    let dialogsElements = state.dialogs.map(dialog =>
        <DialogItem name={dialog.name} avatar={dialog.avatar} id={dialog.id}/>
    )
    let messagesElements = state.messages.map(message => <Message message={message.message}/>)
    let message = React.createRef();
    let messageSender = () => {
        // let text = message.current.value;
        addMessage();
    }
    let onMessageChange = () => {
        let text = message.current.value;
        updateNewMessage(text)
        console.log(text)
    }
    return (
        <div className={styles.dialogs}>
            <div className={styles.dialogsItems}>
                {dialogsElements}
            </div>
            <div className={stylesMessages.sender}>
                <div className={stylesMessages.messages}>{messagesElements}</div>
                <div className={stylesMessages.messages_container}>
                    <textarea ref={message} onChange={onMessageChange} value={messages.newDialogMessage} className={stylesMessages.newMessageCreator}/>
                    <button onClick={messageSender}><Send/></button>
                </div>
            </div>
            <Routes>
                <Route element={<Wallpaper/>}/>
                {/*<Route element={<Messages/>} path='/dialogs/1'/>*/}
            </Routes>
        </div>
    )
}

export default Dialogs