import { useState } from "react";
import styles from "./Navbar.module.css";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";

export default function Navbar() {
    const [expanded, setExpanded] = useState(true);

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
                {expanded ? (
                    <HiChevronLeft size={20} />
                ) : (
                    <HiChevronRight size={20} />
                )}
            </div>

            <div
                className={`${styles.items} ${
                    !expanded ? styles.hiddenItems : ""
                }`}
            >
                <div className={styles.item}>Dashboard</div>
                <div className={styles.item}>Messages</div>
                <div className={styles.item}>Profile</div>
                <div className={styles.item}>Settings</div>
            </div>
        </aside>
    );
}
