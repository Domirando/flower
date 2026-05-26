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
        bio: "",
        interests: "",
        email: "",
        password: "",
    });
    // Primary Telegram channel + extra channels
    const [primaryChannel, setPrimaryChannel] = useState("");
    const [extraChannels, setExtraChannels] = useState([]);
    const [showChannels, setShowChannels] = useState(false);

    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState("signup");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const addChannel = () => setExtraChannels((prev) => [...prev, ""]);
    const removeChannel = (i) =>
        setExtraChannels((prev) => prev.filter((_, idx) => idx !== i));
    const updateChannel = (i, val) =>
        setExtraChannels((prev) => prev.map((ch, idx) => (idx === i ? val : ch)));

    const allChannels = [primaryChannel, ...extraChannels].filter(Boolean);

    const handleSignUp = async () => {
        const { fullName, bio, interests, email, password } = form;

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
                telegram_channel: primaryChannel,
                telegram_channels: allChannels,
                interests: interests.split(',').map(i => i.trim()).filter(Boolean),
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
                        placeholder="Your full name *"
                        value={form.fullName}
                        onChange={handleChange}
                        className={styles.email_input}
                    />
                    <input
                        type="text"
                        name="bio"
                        placeholder="A little about yourself"
                        value={form.bio}
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

                    {/* Telegram accounts section */}
                    <div className={styles.accounts_section}>
                        <div className={styles.accounts_header}>
                            <span className={styles.accounts_title}>📢 Telegram channels</span>
                            <button
                                type="button"
                                className={styles.add_account_btn}
                                onClick={() => setShowChannels(v => !v)}
                            >
                                {showChannels ? "Hide" : "+ Add accounts"}
                            </button>
                        </div>

                        {showChannels && (
                            <div className={styles.channels_list}>
                                <div className={styles.channel_row}>
                                    <input
                                        type="text"
                                        placeholder="Primary Telegram channel (e.g. @mychannel)"
                                        value={primaryChannel}
                                        onChange={(e) => setPrimaryChannel(e.target.value)}
                                        className={styles.channel_input}
                                    />
                                </div>

                                {extraChannels.map((ch, i) => (
                                    <div key={i} className={styles.channel_row}>
                                        <input
                                            type="text"
                                            placeholder={`Channel ${i + 2} (e.g. @secondchannel)`}
                                            value={ch}
                                            onChange={(e) => updateChannel(i, e.target.value)}
                                            className={styles.channel_input}
                                        />
                                        <button
                                            type="button"
                                            className={styles.remove_channel_btn}
                                            onClick={() => removeChannel(i)}
                                        >✕</button>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    className={styles.more_channel_btn}
                                    onClick={addChannel}
                                >
                                    + Add another channel
                                </button>

                                {allChannels.length > 0 && (
                                    <p className={styles.channels_preview}>
                                        Posts will go to: {allChannels.join(", ")}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}

            <input
                type="email"
                name="email"
                placeholder="Your email *"
                value={form.email}
                onChange={handleChange}
                className={styles.email_input}
            />
            <input
                type="password"
                name="password"
                placeholder="Password *"
                value={form.password}
                onChange={handleChange}
                className={styles.email_input}
            />

            <button
                onClick={mode === "signup" ? handleSignUp : handleLogin}
                disabled={loading}
                className={styles.primaryButton}
            >
                {loading ? "Please wait…" : mode === "signup" ? "Sign Up" : "Login"}
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
