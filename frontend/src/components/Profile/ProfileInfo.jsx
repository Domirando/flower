import styles from './Profile.module.css'

const ProfileInfo = ({user}) => {
    console.log("pf", user);
    return (
        <div className={styles.content_main_card}>
            <div className={styles.content_text}>
                <b>{user.full_name}</b>
                <p>{user.channel_id}</p>
            </div>
            <img src={user.ava} alt={"avatar"}/>
        </div>
    )
}
export default ProfileInfo
