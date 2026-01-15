import styles from './Profile.module.css';
import MyPosts from "./MyPosts/MyPosts";
import ProfileInfo from "./ProfileInfo";
import { useEffect, useState } from "react";
import { supabase } from "../../helper/supabaseClient";

const Profile = ({ user }) => {
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

    const saveChannel = async () => {
        const { error } = await supabase
            .from('users')
            .update({ telegram_channel: channelId })
            .eq('id', user.id);

        if (error) alert(error.message);
        else alert('Telegram channel saved!');
    };

    if (loading) return <p>Loading profile...</p>;

    return (
        <div className={styles.content}>
            <img
                src="https://images.unsplash.com/photo-1469474968028-56623f02e42e"
                alt=""
            />

            <div className={styles.main_content}>
                <ProfileInfo user={user} />

                <div>
                    <h3>Telegram Channel</h3>
                    <input
                        type="text"
                        value={channelId}
                        onChange={(e) => setChannelId(e.target.value)}
                        placeholder="e.g. -1001234567890"
                    />
                    <button onClick={saveChannel}>
                        Save Channel
                    </button>
                </div>

                <MyPosts />
            </div>
        </div>
    );
};

export default Profile;
