import styles from './Dialogs.module.css'
import {NavLink} from "react-router-dom";

const Dialogs = (props) => {
    return (
        <div className={styles.dialogs}>
            <div className={styles.dialogsItems}>
                <div className={styles.dialog +' '+ styles.active}>
                    <NavLink to="/dialogs/1">Tommy</NavLink>
                </div>
                <div className={styles.dialog +' '+styles.active}>
                    <NavLink to="/dialogs/2">Peter</NavLink>
                </div>
                <div className={styles.dialog + ' ' + styles.active}>
                    <NavLink to="/dialogs/3">Rose</NavLink>
                </div>
                <div className={styles.dialog + ' '+ styles.active}>
                    <NavLink to="/dialogs/4">Ann</NavLink>
                </div>
                <div className={styles.dialog + ' '+styles.active}>
                    <NavLink to="/dialogs/5">Maisie</NavLink>
                </div>
                <div className={styles.dialog + ' ' +styles.active}>
                    <NavLink to="/dialogs/6">Harry</NavLink>
                </div>
                <div className={styles.dialog +' '+ styles.active}>
                    <NavLink to="/dialogs/7">Ron</NavLink>
                </div>
            </div>
            <div className={styles.messages}>
                <span className={styles.message}>hi</span>
                <span className={styles.message}>are you?</span>
                <span className={styles.message}>what are you doing?</span>
            </div>
        </div>
    )
}

export default Dialogs