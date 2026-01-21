import styles from './Profile.module.css';
import MyPosts from "./MyPosts/MyPosts";
import { useEffect, useState } from "react";
import { supabase } from "../../helper/supabaseClient";

const Profile = ({ user }) => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initProfile = async () => {
            const { data: authUser } = await supabase.auth.getUser();
            if (!authUser?.user?.id) return;

            const userId = authUser.user.id;

            await supabase.from("users").upsert({ id: userId });

            setLoading(false);
        };

        initProfile();
    }, []);

    if (loading) return <p>Loading profile...</p>;

    return (
        <div className={styles.content}>
            <img
                src="https://images.unsplash.com/photo-1469474968028-56623f02e42e"
                alt=""
            />

            <div className={styles.main_content}>

                <MyPosts />
            </div>
        </div>
    );
};

export default Profile;
