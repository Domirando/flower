import logo from '../../assets/logo.png';
import styles from './Header.module.css'

const Header = () => {
    return (
        <header className={styles.header}>
            <div className={styles.header_content}>
                <img src={logo} alt=''/>
            </div>
        </header>
    )
}
export default Header