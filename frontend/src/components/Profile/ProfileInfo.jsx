import styles from './Profile.module.css'
import state from "../../redux/state";

const ProfileInfo = () => {
    console.log("state", state)
    console.log("state user", state.profilePage)
    return (
        <div className={styles.content_main_card}>
            <div className={styles.content_text}>
                <b>Maftuna Vohidjonovna</b>
                <p>Chemical and Materials Engineer doing her research on quantum computers alongside her IT projects as
                    she loves coding</p>
            </div>
            <img src='https://pbs.twimg.com/profile_images/1954804795828785152/Vmx_KtOP_400x400.jpg' alt={"avatar"}/>
        </div>
    )
}
export default ProfileInfo
