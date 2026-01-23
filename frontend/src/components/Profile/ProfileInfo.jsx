import styles from './Profile.module.css'
import state from "../../redux/state";

const ProfileInfo = () => {
    return (
        <div className={styles.content_main_card}>
            <div className={styles.content_text}>
                <b>{state.profilePage.user.full_name}</b>
                <p>{state.profilePage.user.bio}</p>
            </div>
            <img src='https://pbs.twimg.com/profile_images/1954804795828785152/Vmx_KtOP_400x400.jpg' alt={"avatar"}/>
        </div>
    )
}
export default ProfileInfo
