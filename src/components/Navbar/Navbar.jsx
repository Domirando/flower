    import styles from './Navbar.module.css'
    import NavbarItem from "./NavbarItem";
    import { FaAngleLeft } from "react-icons/fa6";
    import {useState} from 'react';

    const Navbar = () => {
        let [wrap, unWrap] = useState(false);

        return (
            <nav className={styles.nav}>
                <div className={ wrap ? styles.hide : styles.show}>
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