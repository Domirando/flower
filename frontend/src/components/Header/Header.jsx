import logo from '../../assets/logo.png';
import styles from './Header.module.css'
import ProfileInfo from "../Profile/ProfileInfo";

const Header = ({state}) => {
    console.log("hu", state.profilePage.user);
    return (
        <header className={styles.header}>
            <div className={styles.header_content}>
                <img src={logo} alt=''/>
                <ProfileInfo  user = {state.profilePage.user} />
            </div>

        </header>
    )
}
export default Header