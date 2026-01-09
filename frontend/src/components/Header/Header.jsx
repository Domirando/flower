import logo from '../../assets/logo.png';
import styles from './Header.module.css'
import TelegramTest from "../../test/TelegramTest";

const Header = () => {
    return (
        <header className={styles.header}>
            <div className={styles.header_content}>
                <img src={logo} alt=''/>
                <TelegramTest/>  {/*test backend login with dummy user*/}
            </div>
        </header>
    )
}
export default Header