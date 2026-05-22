import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setToken } from "../../api/client";
import { setUser } from "../../redux/state";
import styles from "./Auth.module.css";

const Auth = () => {
    const navigate = useNavigate();
    const [avatar, setAvatar] = useState(null);
    const [form, setForm] = useState({
        fullName: "",
        telegramChannel: "",
        bio: "",
        interests: "",
        email: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState("signup");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSignUp = async () => {
        const { fullName, telegramChannel, bio, interests, email, password } = form;

        if (!fullName || !email || !password) {
            alert("Please fill in all required fields");
            return;
        }

        setLoading(true);
        try {
            const { token, user } = await api.register({
                email,
                password,
                full_name: fullName,
                bio,
                telegram_channel: telegramChannel,
                interests: interests.split(',').map(i => i.trim()).filter(Boolean)
            });

            setToken(token);
            setUser(user);

            if (avatar) {
                const formData = new FormData();
                formData.append("file", avatar);
                const { avatar_url } = await api.uploadAvatar(formData);
                setUser({ ...user, avatar_url });
            }

            navigate("/");
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        const { email, password } = form;

        if (!email || !password) {
            alert("Enter email and password");
            return;
        }

        setLoading(true);
        try {
            const { token, user } = await api.login({ email, password });
            setToken(token);
            setUser(user);
            navigate("/");
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
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
                        placeholder="A little description about yourself"
                        value={form.bio}
                        onChange={handleChange}
                        className={styles.email_input}
                    />
                    <input
                        type="text"
                        name="telegramChannel"
                        placeholder="Your Telegram channel (e.g. @mychannel)"
                        value={form.telegramChannel}
                        onChange={handleChange}
                        className={styles.email_input}
                    />
                    <input
                        type="text"
                        name="interests"
                        placeholder="Topics of interest (e.g. tech, sports, science)"
                        value={form.interests}
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
                {loading ? "Please wait..." : mode === "signup" ? "Sign Up" : "Login"}
            </button>

            <button
                type="button"
                onClick={() => setMode(mode === "signup" ? "login" : "signup")}
                className={styles.linkButton}
            >
                {mode === "signup" ? "Already have an account? Login" : "New user? Sign Up"}
            </button>
        </div>
    );
};

export default Auth;
