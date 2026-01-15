import React, { useEffect } from "react";

const TelegramAuth = ({ onAuth }) => {
    useEffect(() => {
        window.handleTelegramAuth = function(user) {
            alert("Logged in as: " + user.first_name);
            console.log("Telegram user object:", user);
        };

        const script = document.createElement("script");
        script.src = "https://telegram.org/js/telegram-widget.js?8";
        script.async = true;
        script.setAttribute("data-telegram-login", "DomiFlowerBot"); // no @
        script.setAttribute("data-size", "large");
        script.setAttribute("data-request-access", "write");
        script.setAttribute("data-onauth", "handleTelegramAuth(user)");

        document.getElementById("telegram-button").appendChild(script);
    }, [onAuth]);

    return <div id="telegram-button"></div>;
};

export default TelegramAuth;
