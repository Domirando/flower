import styles from './Profile.module.css'

const ProfileInfo = ({user}) => {
    console.log("pf", user);
    return (
        <div className={styles.content_main_card}>
            <div className={styles.content_text}>
                <b>{user.full_name}</b>
                <p>{user.bio}</p>
            </div>
            <img src='https://pbs.twimg.com/profile_images/1954804795828785152/Vmx_KtOP_400x400.jpg' alt={"avatar"}/>
        </div>
    )
}
export default ProfileInfo
