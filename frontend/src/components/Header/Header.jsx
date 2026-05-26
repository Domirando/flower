import logo from '../../assets/logo.png';
import styles from './Header.module.css'
import ProfileInfo from "../Profile/ProfileInfo";
import { Link } from "react-router-dom";

const Header = ({state}) => {
    return (
        <header className={styles.header}>
            <div className={styles.header_content}>
                <div className={styles.left_section}>
                    <Link to="/" className={styles.logo}>
                        <img src={logo} alt='Flower Logo'/>
                        <span className={styles.logo_text}>Flower</span>
                    </Link>
                    <nav className={styles.nav_links}>
                        <Link to="/about" className={styles.nav_link}>About</Link>
                        <Link to="/news" className={styles.nav_link}>News</Link>
                    </nav>
                </div>
                <Link to="/settings"><ProfileInfo user={state.profilePage.user} /></Link>
            </div>
        </header>
    )
}
export default Header