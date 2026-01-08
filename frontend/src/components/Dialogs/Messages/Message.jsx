import styles from "./Messages.module.css";

const Message = ({ message }) => {
    return (
        <span className={styles.message}>{message}</span>
    )
}
export default Message