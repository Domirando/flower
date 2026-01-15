import styles from "./Navbar.module.css";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import NavbarItem from "./NavbarItem";
import TelegramTest from "../../test/TelegramTest";

export default function Navbar({ expanded, setExpanded }) {
    return (
        <aside
            className={`${styles.navbar} ${
                expanded ? styles.expanded : styles.collapsed
            }`}
        >
            <div
                className={styles.toggleButton}
                onClick={() => setExpanded(!expanded)}
            >
                {expanded ? <HiChevronLeft size={20} /> : <HiChevronRight size={20} />}
            </div>

            {expanded && (
                <div className={styles.items}>
                    <NavbarItem name="Profile" link="/" />
                    <NavbarItem name="Messenger" link="dialogs" />
                    <NavbarItem name="Music" link="music" />
                    <NavbarItem name="Books" link="books" />
                    <NavbarItem name="News" link="news" />
                    <NavbarItem name="Login" link="login" />
                </div>
            )}
        </aside>
    );
}
