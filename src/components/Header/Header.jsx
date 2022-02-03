import logo from '../../assets/logo.png';
import styles from './Header.module.css'

const Header = () => {
    return (
        <header className={styles.header}>
            <img src={logo} alt=''/>
        </header>
    )
}
export default Header