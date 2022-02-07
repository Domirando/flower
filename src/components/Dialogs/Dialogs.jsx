import styles from './Dialogs.module.css'
import {NavLink} from "react-router-dom";
import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";
import Messages from "./Messages";
import Wallpaper from "./Wallpaper";
import DialogItem from "./DialogItem";


const Dialogs = (props) => {
    return (
        <BrowserRouter>
            <div className={styles.dialogs}>
                <div className={styles.dialogsItems}>
                    <DialogItem name='Tommy' id='1'/>
                    <DialogItem name='Sara' id='2'/>
                    <DialogItem name='Maisie' id='3'/>
                </div>
                <Routes>
                    <Route element={<Wallpaper/>}/>
                </Routes>
            </div>
        </BrowserRouter>
    )
}

export default Dialogs