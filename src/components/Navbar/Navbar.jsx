import styles from './Navbar.module.css'
import {NavLink} from "react-router-dom";

const Navbar = () => {
    const style = {
        background: 'green',
        fontWeight: 800
    }

    return (
        <nav className={styles.nav} >
            <div className={styles.item}>
                <NavLink className={({ isActive }) => isActive ? styles.active : undefined} to='/' > Profile </NavLink>
            </div>
            <div className={styles.item}>
                <NavLink className={({ isActive }) => isActive ? styles.active : undefined} to='news'> News </NavLink>
            </div>
            <div className={styles.item}>
                <NavLink className={({ isActive }) => isActive ? styles.active : undefined} to='dialogs'> Messages </NavLink>
            </div>
            <div className={styles.item}>
                <NavLink className={({ isActive }) => isActive ? styles.active : undefined} to='settings' > Settings </NavLink>
            </div>
        </nav>
    )
}
export default Navbar