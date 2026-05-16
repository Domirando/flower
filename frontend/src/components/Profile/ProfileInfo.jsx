import styles from './Profile.module.css'
import { Link } from 'react-router-dom'

const ProfileInfo = ({user}) => {
    const isAuthenticated = !!user?.email;

    if (!isAuthenticated) {
        return (
            <div className={styles.content_main_card}>
                <Link to="/login" className={styles.login_button}>
                    Sign Up
                </Link>
            </div>
        );
    }

    return (
        <div className={styles.content_main_card}>
            <div className={styles.content_text}>
                <b className={styles.user_name}>{user.full_name}</b>
                <p className={styles.user_bio}>{user.bio}</p>
            </div>
            <div className={styles.avatar_container}>
                <img src={user.avatar_url} alt={"avatar"} className={styles.avatar_img}/>
            </div>
        </div>
    )
}
export default ProfileInfo
