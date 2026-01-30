import styles from './Profile.module.css'

const ProfileInfo = ({user}) => {
    return (
        <div className={styles.content_main_card}>
            <div className={styles.content_text}>
                <b>{user.full_name}</b>
                <p>{user.bio}</p>
            </div>
            <img src={user.avatar_url} alt={"avatar"}/>
        </div>
    )
}
export default ProfileInfo
