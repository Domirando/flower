import styles from './Profile.module.css'
import MyPosts from "./MyPosts/MyPosts";
import ProfileInfo from "./ProfileInfo";
import TelegramAuth from "../Auth/TelegramAuth";
import {useState} from "react";

const Profile = ( { profilePage, addPost, updateNewPosText }) => {
    const [telegramUser, setTelegramUser] = useState(null);
    return (
        <div className={styles.content}>
            <img src='https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=874&q=80' alt=''/>
            <div className={styles.main_content}>
                <ProfileInfo />
                <div>
                    {!telegramUser ? (
                        <TelegramAuth onAuth={setTelegramUser} />
                    ) : (
                        <>
                            <p>Logged in as: {telegramUser.first_name}</p>
                            <MyPosts telegramUser={telegramUser} />
                        </>
                    )}
                </div>
                <MyPosts />
            </div>
        </div>
    )
}
export default Profile;