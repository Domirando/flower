import styles from './Navbar.module.css'
import {NavLink} from "react-router-dom";
import NavbarItem from "./NavbarItem";

const Navbar = () => {
    const style = {
        background: 'green',
        fontWeight: 800
    }

    return (
        <nav className={styles.nav} >
            <NavbarItem name='Profile' link='/'/>
            <NavbarItem name='Messenger' link='dialogs'/>
            <NavbarItem name='Music' link='music'/>
            <NavbarItem name='Books' link='books'/>
            <NavbarItem name='News' link='news'/>
        </nav>
    )
}
export default Navbar