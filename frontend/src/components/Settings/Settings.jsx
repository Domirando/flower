import styles from './Settings.module.css';
import { supabase } from "../../helper/supabaseClient";
import { clearUser } from "../../redux/state";

const Settings = ({user}) => {
    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Error logging out:", error.message);
        } else {
            clearUser();
        }
    };

    return (
        <div className={styles.settings_wrapper}>
            <h1>Settings</h1>
            <div className={styles.user_info}>
                <div className={styles.avatar_container}>
                    <img src={user.avatar_url} alt="Profile" className={styles.avatar} />
                </div>
                <div className={styles.details}>
                    <div>
                        <strong>Name:</strong> {user.full_name}
                    </div>
                    <div>
                        <strong>Biography:</strong> {user.bio}
                    </div>
                    <div>
                        <strong>Email:</strong> {user.email}
                    </div>
                </div>
            </div>
            <button className={styles.logout_btn} onClick={handleLogout}>
                Log out
            </button>
        </div>
    );
};

export default Settings;
