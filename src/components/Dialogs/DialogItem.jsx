import styles from "./Dialogs.module.css";
import {NavLink} from "react-router-dom";

const DialogItem = ({ name, id }) => {
    let path = "/dialogs/"+id
    return (
        <div className={styles.dialog}>
            <NavLink to={path} className={({isActive}) => isActive ? styles.active : undefined}>{name}</NavLink>
        </div>
    )
}
export default DialogItem