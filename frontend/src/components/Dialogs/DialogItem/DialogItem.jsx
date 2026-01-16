import styles from "../Dialogs.module.css";
import {NavLink} from "react-router-dom";

const DialogItem = ({ name, id, avatar }) => {
    let path = "/dialogs/"+id
    return (
        <div className={styles.dialog}>
            <img src={avatar} alt="avatar" className={styles.avatar}/>
            <NavLink to={path} className={({isActive}) => isActive ? styles.active : undefined}>{name}</NavLink>
        </div>
    )
}
export default DialogItem