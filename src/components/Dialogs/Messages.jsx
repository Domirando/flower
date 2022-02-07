import styles from "./Messages.module.css";
import Message from "./Message";

const Messages = () => {
    return (
        <div className={styles.messages}>
            <Message message='hi' />
            <Message message='how are you?' />
            <Message message='what are you doing?' />
        </div>
    )
}

export default Messages