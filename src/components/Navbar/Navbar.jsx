import styles from './Navbar.module.css'
import {NavLink} from "react-router-dom";
import NavbarItem from "./NavbarItem";
import { FaAngleLeft } from "react-icons/fa6";
import {Fragment, useState} from 'react';

const Navbar = () => {
    const style = {
        background: 'green',
        fontWeight: 800
    }
    let [wrap, unWrap] = useState(false);


    return (
        <nav className={styles.nav}>
            <div className={({ wrap }) => wrap ? styles.hidden : styles.flex}>
                <NavbarItem name='Profile' link='/'/>
                <NavbarItem name='Messenger' link='dialogs'/>
                <NavbarItem name='Music' link='music'/>
                <NavbarItem name='Books' link='books'/>
                <NavbarItem name='News' link='news'/>
            </div>

            <div>
                <FaAngleLeft onClick={() => unWrap(!wrap)}/>
            </div>
        </nav>
    )
}
export default Navbar