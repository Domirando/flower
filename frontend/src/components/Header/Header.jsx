import logo from '../../assets/logo.png';
import styles from './Header.module.css'
import ProfileInfo from "../Profile/ProfileInfo";

const Header = () => {
    return (
        <header className={styles.header}>
            <div className={styles.header_content}>
                <img src={logo} alt=''/>
                <ProfileInfo  />
            </div>

        </header>
    )
}
export default Header