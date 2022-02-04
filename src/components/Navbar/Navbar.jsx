import styles from './Navbar.module.css'
import {Link } from "react-router-dom";

const Navbar = () => {
    return (
        <nav className={styles.nav}>
            <div className={`${styles.item} ${styles.active}`}>
                <Link to='profile'> Profile </Link>
            </div>
            <div className={styles.item}>
                <Link to='news'> News </Link>
            </div>
            <div className={styles.item}>
                <Link to='dialogs'> Messages </Link>
            </div>
            <div className={styles.item}>
                <Link to='settings'> Settings </Link>
            </div>

        </nav>
    )
}
export default Navbar