import styles from "./Navbar.module.css";
import { HiChevronLeft, HiChevronRight, HiUser, HiPlusCircle, HiNewspaper, HiChat, HiMusicNote, HiBookOpen, HiCog, HiInformationCircle, HiLogin } from "react-icons/hi";
import NavbarItem from "./NavbarItem";

export default function Navbar({ expanded, setExpanded, user }) {
    const isAuthenticated = !!user?.id;

    return (
        <aside
            className={`${styles.navbar} ${
                expanded ? styles.expanded : styles.collapsed
            }`}
        >
            <div className={styles.items}>
                <NavbarItem name={expanded ? "Profile" : ""} icon={<HiUser size={20} />} link="/" />
                
                <NavbarItem name={expanded ? "New Post" : ""} icon={<HiPlusCircle size={20} />} link="/posting" />
                
                {isAuthenticated && (
                    <>
                        <NavbarItem name={expanded ? "Messaging" : ""} icon={<HiChat size={20} />} link="/dialogs" />
                        <NavbarItem name={expanded ? "Music" : ""} icon={<HiMusicNote size={20} />} link="/music" />
                        <NavbarItem name={expanded ? "Books" : ""} icon={<HiBookOpen size={20} />} link="/books" />
                    </>
                )}
                
                {isAuthenticated ? (
                    <NavbarItem name={expanded ? "Settings" : ""} icon={<HiCog size={20} />} link="/settings" />
                ) : (
                    <NavbarItem name={expanded ? "Sign up/Login" : ""} icon={<HiLogin size={20} />} link="/login" />
                )}
            </div>

            <div
                className={styles.toggleButton}
                onClick={() => setExpanded(!expanded)}
            >
                {expanded ? <HiChevronLeft size={24} /> : <HiChevronRight size={24} />}
            </div>
        </aside>
    );
}
