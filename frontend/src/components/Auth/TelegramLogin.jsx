import { useEffect } from "react";

const TelegramLogin = () => {
    useEffect(() => {
        const backendUrl = process.env.REACT_APP_BACKEND_URL; // Make sure this is set in .env

        const script = document.createElement("script");
        script.src = "https://telegram.org/js/telegram-widget.js?22";
        script.async = true;
        script.setAttribute("data-telegram-login", "DomiFlowerBot");
        script.setAttribute("data-size", "large");
        script.setAttribute("data-userpic", "true");
        script.setAttribute("data-request-access", "write");
        script.setAttribute("data-auth-url", `${backendUrl}/api/auth/telegram`); // Telegram will POST user data here

        const container = document.getElementById("telegram-login");
        container.innerHTML = ""; // clear any previous script
        container.appendChild(script);
    }, []);

    return (
        <div className="flex justify-center mt-10">
            <div id="telegram-login"></div>
        </div>
    );
};

export default TelegramLogin;
