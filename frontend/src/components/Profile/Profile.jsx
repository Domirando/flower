import styles from './Profile.module.css';
import MyPosts from "./MyPosts/MyPosts";
import ProfileInfo from "./ProfileInfo";
import { useEffect, useState } from "react";
import { supabase } from "../../helper/supabaseClient";

const Profile = ({ user, state }) => {
    const [channelId, setChannelId] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initProfile = async () => {
            const { data: authUser } = await supabase.auth.getUser();
            if (!authUser?.user?.id) return;

            const userId = authUser.user.id;

            await supabase.from("users").upsert({ id: userId });

            const { data, error } = await supabase
                .from("users")
                .select("telegram_channel")
                .eq("id", userId)
                .single();

            if (error) {
                console.error("Failed to fetch profile:", error.message);
            } else if (data?.telegram_channel) {
                setChannelId(data.telegram_channel);
            }

            setLoading(false);
        };

        initProfile();
    }, []);
    console.log("state:", user)

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
