import styles from './Profile.module.css';
import MyPosts from "./MyPosts/MyPosts";

const Profile = () => {
    return (
        <div className={styles.content}>
            <div className={styles.admin_header}>
                <div className={styles.admin_title_group}>
                    <h1 className={styles.admin_title}>Content Management</h1>
                    <p className={styles.admin_subtitle}>Manage your posts and platform integrations</p>
                </div>
                <div className={styles.stats_grid}>
                    <div className={styles.stat_card}>
                        <span className={styles.stat_value}>Posts</span>
                        <span className={styles.stat_label}>Your posts only</span>
                    </div>
                </div>
            </div>
            <MyPosts />
        </div>
    );
};

export default Profile;
