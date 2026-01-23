import { useState } from "react";
import { supabase } from "../../helper/supabaseClient";
import styles from "./Auth.module.css";

const Auth = () => {
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

        if (password.length < 8 || password.length > 16) {
            alert("Password must be 8–16 characters long");
            return;
        }

        setLoading(true);

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    telegram_channel: telegramChannel,
                    bio: bio
                },
                emailRedirectTo: window.location.origin
            }
        });

        setLoading(false);

        if (error) {
            alert(error.message);
        } else {
            alert("Check your email to confirm your account");
            setMode("login"); // ✅ UX fix
        }
    };

    const handleLogin = async () => {
        const { email, password } = form;

        if (!email || !password) {
            alert("Enter email and password");
            return;
        }

        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        setLoading(false);

        if (error) {
            alert(error.message);
        }
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
