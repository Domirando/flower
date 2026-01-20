import { useState } from "react";
import styles from "./Login.module.css";
import { supabase } from "../../helper/supabaseClient";

const Login = () => {
    const [form, setForm] = useState({
        fullName: "",
        telegramId: "",
        email: "",
        password: ""
    });

    const [loading, setLoading] = useState(false);

    // One handler for all inputs
    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSignUp = async () => {
        const { fullName, telegramId, email, password } = form;

        if (!fullName || !telegramId || !email || !password) {
            alert("Please fill in all fields");
            return;
        }

        if (password.length <= 8 || password.length >= 16) {
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
                    telegram_channel: telegramId
                },
                emailRedirectTo: window.location.origin
            }
        });

        setLoading(false);

        if (error) {
            alert(error.message);
        } else {
            alert("Check your email to confirm your account!");
        }
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.header}>Sign Up</h2>

            <input
                className={styles.email_input}
                type="text"
                name="fullName"
                placeholder="Your full name"
                value={form.fullName}
                onChange={handleChange}
            />

            <input
                className={styles.email_input}
                type="text"
                name="telegramId"
                placeholder="Your Telegram channel ID"
                value={form.telegramId}
                onChange={handleChange}
            />

            <input
                className={styles.email_input}
                type="email"
                name="email"
                placeholder="Your email"
                value={form.email}
                onChange={handleChange}
            />

            <input
                className={styles.email_input}
                type="password"
                name="password"
                placeholder="Set a password"
                value={form.password}
                onChange={handleChange}
            />

            <button
                onClick={handleSignUp}
                disabled={loading}
                style={{ width: "100%", padding: "10px" }}
            >
                {loading ? "Creating account..." : "Sign Up"}
            </button>
        </div>
    );
};

export default Login;
