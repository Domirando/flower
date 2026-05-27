import styles from './Footer.module.css';
import { Link } from 'react-router-dom';

export default function Footer() {
    let currentYear = new Date().getFullYear();
    if (currentYear !== 2026) {
        currentYear = "2026 - " + currentYear;
    }
    console.log(currentYear);
    return (
        <footer className={styles.footer}>
            <div className={styles.content}>
                <span className={styles.brand}>Flower</span>
                <span className={styles.copy}>© {currentYear} Flower</span>
            </div>
        </footer>
    );
}
