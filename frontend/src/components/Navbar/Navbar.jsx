import styles from "./Navbar.module.css";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import NavbarItem from "./NavbarItem";

export default function Navbar({ expanded, setExpanded, user }) {
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
                    <NavbarItem name="New Post" link="/posting" />
                    {user && <NavbarItem name="Music" link="/music" />}
                    {user ? (
                        <NavbarItem name="Settings" link="/settings" />
                    ) : (
                        <NavbarItem name="Sign up/Login" link="/login" />
                    )}
                </div>
            )}
        </aside>
    );
}
