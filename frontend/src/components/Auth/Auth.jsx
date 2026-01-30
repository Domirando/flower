import { useState } from "react";
import { supabase } from "../../helper/supabaseClient";
import styles from "./Auth.module.css";
import {useNavigate} from "react-router-dom";
import state, {setUser} from "../../redux/state";

const Auth = () => {
    const navigate = useNavigate();
    const [avatar, setAvatar] = useState(null);
    const [form, setForm] = useState({
        fullName: "",
        telegramChannel: "",
        bio: "",
        email: "",
        password: ""
    });

    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState("signup"); // signup | login

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSignUp = async () => {
        const { fullName, telegramChannel, bio, email, password } = form;

        if (!fullName || !telegramChannel || !email || !password) {
            alert("Please fill in all fields");
            return;
        }

        setLoading(true);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    telegram_channel: telegramChannel,
                    bio
                }
            }
        });

        if (error) {
            setLoading(false);
            alert(error.message);
            return;
        }

        const userId = data.user.id;

        try {
            const avatarUrl = avatar ? await uploadAvatar(avatar) : null;

            if (avatarUrl) {
                await supabase
                    .from("users")
                    .update({ avatar_url: avatarUrl })
                    .eq("id", userId);
            }

            alert("Check your email to confirm your account");
            setMode("login");

        } catch (err) {
            alert("Avatar upload failed");
        }

        setLoading(false);
    };

    const handleLogin = async () => {
        const { email, password } = form;

        if (!email || !password) {
            alert("Enter email and password");
            return;
        }

        setLoading(true);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            setLoading(false);
            alert(error.message);
            return;
        } else{
            console.log("data log?", data);
            console.log("state log?", state.profilePage.user);
            setUser({
                email: data?.user.email,
                full_name: data?.user.user_metadata.full_name,
                channel_id: data?.user.user_metadata.channel_id,
                bio: data?.user.user_metadata.bio,
                avatar_url: data?.user.user_metadata.avatar_url,
            });
            console.log("state after log?", state.profilePage.user);
        }

        // 🔥 FORCE REFRESH USER DATA
        await supabase.auth.getUser();

        setLoading(false);
        navigate("/");
    };

    const uploadAvatar = async (file) => {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user || !file) return;

        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error } = await supabase.storage
            .from("avatars")
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: true,
                contentType: file.type
            });

        if (error) {
            console.error("Upload error:", error.message);
            alert(error.message);
            return;
        }

        const { data } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    const handleLogout = async () => {
        setLoading(true);

        const { error } = await supabase.auth.signOut();

        setLoading(false);

        if (error) alert(error.message);
        else alert("Logged out successfully!");
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.header}>
                {mode === "signup" ? "Sign Up" : "Login"}
            </h2>

            {mode === "signup" && (
                <>
                    <input
                        type="text"
                        name="fullName"
                        placeholder="Your full name"
                        value={form.fullName}
                        onChange={handleChange}
                        className={styles.email_input}
                    />

                    <input
                        type="text"
                        name="bio"
                        placeholder="A little desciption about yourself"
                        value={form.bio}
                        onChange={handleChange}
                        className={styles.email_input}
                    />

                    <input
                        type="text"
                        name="telegramChannel"
                        placeholder="Your Telegram channel"
                        value={form.telegramChannel}
                        onChange={handleChange}
                        className={styles.email_input}
                    />

                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setAvatar(e.target.files[0])}
                        className={styles.email_input}
                    />
                </>
            )}

            <input
                type="email"
                name="email"
                placeholder="Your email"
                value={form.email}
                onChange={handleChange}
                className={styles.email_input}
            />

            <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className={styles.email_input}
            />

            <button
                onClick={mode === "signup" ? handleSignUp : handleLogin}
                disabled={loading}
                className={styles.primaryButton}
            >
                {loading
                    ? "Please wait..."
                    : mode === "signup"
                        ? "Sign Up"
                        : "Login"}
            </button>

            <button
                type="button"
                onClick={() =>
                    setMode(mode === "signup" ? "login" : "signup")
                }
                className={styles.linkButton}
            >
                {mode === "signup"
                    ? "Already have an account? Login"
                    : "New user? Sign Up"}
            </button>

            <button
                onClick={handleLogout}
                disabled={loading}
                className={styles.logoutButton}
            >
                Logout
            </button>
        </div>
    );
};

export default Auth;
