import { useState } from "react";
import { supabase } from "../../helper/supabaseClient";

const Login = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email) {
            alert("Please enter your email");
            return;
        }

        setLoading(true);

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin
            }
        });

        setLoading(false);

        if (error) {
            alert(error.message);
        } else {
            alert("Check your email for the login link!");
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: "60px auto" }}>
            <h2>Login</h2>

            <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
            />

            <button
                onClick={handleLogin}
                disabled={loading}
                style={{ width: "100%", padding: "10px" }}
            >
                {loading ? "Sending link..." : "Send magic link"}
            </button>
        </div>
    );
};

export default Login;
