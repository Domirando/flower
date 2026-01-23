import styles from './Profile.module.css';
import MyPosts from "./MyPosts/MyPosts";
import {useEffect, useState} from "react";
import {supabase} from "../../helper/supabaseClient";
import state from "../../redux/state";

const Profile = () => {
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const initProfile = async () => {
            const {data: authUser} = await supabase.auth.getUser();
            if (!authUser?.user?.id) return;

            const userId = authUser.user.id;

            await supabase.from("users").upsert({id: userId});

            setLoading(false);
        };

        initProfile();
    }, []);

    if (loading) return <p>Loading profile...</p>;
    console.log("user in profile:", state.profilePage.user)

    return (
        <div className={styles.content}>
            <div className={styles.title}>
                <h1>
                    Profile: Posts & Articles
                </h1>
            </div>

            <MyPosts/>
        </div>
    );
};

export default Profile;
