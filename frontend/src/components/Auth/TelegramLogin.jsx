import { useEffect } from "react";

const TelegramLogin = () => {
    useEffect(() => {
        window.onTelegramAuth = async (user) => {
            const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/telegram`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(user),
            });

            const data = await res.json();
            console.log("Telegram auth response:", data);

            if (data.token) {
                localStorage.setItem("token", data.token);
                alert("Logged in successfully 🌸");
            }
        };

        const script = document.createElement("script");
        script.src = "https://telegram.org/js/telegram-widget.js?22";
        script.setAttribute("data-telegram-login", "flower_auth_bot");
        script.setAttribute("data-size", "large");
        script.setAttribute("data-userpic", "true");
        script.setAttribute("data-request-access", "write");
        script.setAttribute("data-onauth", "onTelegramAuth(user)");

        document.getElementById("telegram-login")?.appendChild(script);
    }, []);

    return (
        <div className="flex justify-center mt-10">
            <div id="telegram-login"></div>
        </div>
    );
};

export default TelegramLogin;
