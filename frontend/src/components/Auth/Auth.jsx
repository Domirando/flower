import { useState } from "react";
import { supabase } from "../../helper/supabaseClient";
import styles from "./Auth.module.css";

const Auth = () => {
    const [form, setForm] = useState({
        fullName: "",
        telegramChannel: "",
        email: "",
        password: ""
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    // -------- SIGNUP --------
    const handleSignUp = async () => {
        const { fullName, telegramChannel, email, password } = form;

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
                    telegram_channel: telegramChannel
                },
                emailRedirectTo: window.location.origin
            }
        });

        setLoading(false);

        if (error) alert(error.message);
        else alert("Check your email to confirm your account!");
    };

    // -------- LOGIN --------
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
        console.log(data);
        setLoading(false);

        if (error) alert(error.message);
        else alert("Logged in successfully!");
    };

    // -------- LOGOUT --------
    const handleLogout = async () => {
        setLoading(true);

        const { error } = await supabase.auth.signOut();

        setLoading(false);

        if (error) alert(error.message);
        else alert("Logged out successfully!");
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.header}>Auth</h2>

            {/* Full Name */}
            <input
                type="text"
                name="fullName"
                placeholder="Your full name"
                value={form.fullName}
                onChange={handleChange}
                className={styles.email_input}
            />

            {/* Telegram Channel */}
            <input
                type="text"
                name="telegramChannel"
                placeholder="Your Telegram channel"
                value={form.telegramChannel}
                onChange={handleChange}
                className={styles.email_input}
            />

            {/* Email */}
            <input
                type="email"
                name="email"
                placeholder="Your email"
                value={form.email}
                onChange={handleChange}
                className={styles.email_input}
            />

            {/* Password */}
            <input
                type="password"
                name="password"
                placeholder="Set a password"
                value={form.password}
                onChange={handleChange}
                className={styles.email_input}
            />

            {/* Buttons */}
            <button
                onClick={handleSignUp}
                disabled={loading}
                style={{ width: "100%", padding: "10px" }}
            >
                {loading ? "Creating account..." : "Sign Up"}
            </button>

            <button
                onClick={handleLogin}
                disabled={loading}
                style={{ width: "100%", padding: "10px", marginTop: "10px" }}
            >
                {loading ? "Logging in..." : "Auth"}
            </button>

            <button
                onClick={handleLogout}
                disabled={loading}
                style={{ width: "100%", padding: "10px", marginTop: "10px" }}
            >
                {loading ? "Logging out..." : "Logout"}
            </button>
        </div>
    );
};

export default Auth;
