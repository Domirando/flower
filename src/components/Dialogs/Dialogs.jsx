import styles from './Dialogs.module.css'
import {NavLink} from "react-router-dom";

const Dialogs = (props) => {
    return (
        <div className={styles.dialogs}>
            <div className={styles.dialogsItems}>
                <div className={styles.dialog}>
                    <NavLink to="/dialogs/1" className={({isActive}) => isActive ? styles.active : undefined}>Tommy</NavLink>
                </div>
                <div className={styles.dialog}>
                    <NavLink to="/dialogs/2" className={({isActive}) => isActive ? styles.active : undefined}>Peter</NavLink>
                </div>
                <div className={styles.dialog}>
                    <NavLink to="/dialogs/3" className={({isActive}) => isActive ? styles.active : undefined}>Rose</NavLink>
                </div>
                <div className={styles.dialog}>
                    <NavLink to="/dialogs/4" className={({isActive}) => isActive ? styles.active : undefined}>Ann</NavLink>
                </div>
                <div className={styles.dialog}>
                    <NavLink to="/dialogs/5" className={({isActive}) => isActive ? styles.active : undefined}>Maisie</NavLink>
                </div>
                <div className={styles.dialog}>
                    <NavLink to="/dialogs/6" className={({isActive}) => isActive ? styles.active : undefined}>Harry</NavLink>
                </div>
                <div className={styles.dialog}>
                    <NavLink to="/dialogs/7" className={({isActive}) => isActive ? styles.active : undefined}>Ron</NavLink>
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