import React from "react";

const TelegramAuth = ({ onAuth }) => {
    // Create a global handler
    window.handleTelegramAuth = function(user) {
        alert("Logged in as: " + user.first_name);
        console.log("Telegram user object:", user);
        if (onAuth) onAuth(user);
    };

    return (
        <div>
            <script
                async
                src="https://telegram.org/js/telegram-widget.js?15"
                data-telegram-login="DomiFlowerBot" // your bot username
                data-size="large"
                data-onauth="handleTelegramAuth(user)"
                // Remove data-request-access for testing login only
            ></script>
        </div>
    );
};

export default TelegramAuth;
