import styles from "./Navbar.module.css";
import {NavLink} from "react-router-dom";

const NavbarItem = ({ name, link }) => {
    return (
        <div className={styles.item}>
            <NavLink className={({ isActive }) => isActive ? styles.active : undefined} to={link} > {name} </NavLink>
        </div>
    )
}
export default NavbarItem