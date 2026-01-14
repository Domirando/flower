import styles from './Profile.module.css'
import MyPosts from "./MyPosts/MyPosts";
import ProfileInfo from "./ProfileInfo";

const Profile = ( { profilePage, addPost, updateNewPosText }) => {
    return (
        <div className={styles.content}>
            <img src='https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=874&q=80' alt=''/>
            <div className={styles.main_content}>
                <ProfileInfo />
                <MyPosts />
            </div>
        </div>
    )
}
export default Profile;