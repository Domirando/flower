import styles from "./Messages.module.css";

const Messages = () => {
    return (
        <div className={styles.messages}>
            <span className={styles.message}>hi</span>
            <span className={styles.message}>are you?</span>
            <span className={styles.message}>what are you doing?</span>
        </div>
    )
}

export default Messages