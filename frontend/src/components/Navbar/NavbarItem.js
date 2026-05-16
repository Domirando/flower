import styles from "./Navbar.module.css";
import {NavLink} from "react-router-dom";

const NavbarItem = ({ name, link, icon }) => {
    return (
        <div className={styles.item}>
            <NavLink className={({ isActive }) => isActive ? styles.active : undefined} to={link} title={name}>
                {icon && <span className={styles.icon}>{icon}</span>}
                {name && <span className={styles.name}>{name}</span>}
            </NavLink>
        </div>
    )
}
export default NavbarItem