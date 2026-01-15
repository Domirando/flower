import React, { useEffect } from "react";

const TelegramAuth = ({ onAuth }) => {
    useEffect(() => {
        // Create global handler for Telegram auth
        window.handleTelegramAuth = function(user) {
            console.log("Telegram user object:", user);
            alert("Logged in as: " + user.first_name);
            if (onAuth) onAuth(user);
        };
    }, [onAuth]);

    return (
        <div>
            {/* Telegram login widget */}
            <script
                async
                src="https://telegram.org/js/telegram-widget.js?15"
                data-telegram-login="DomiFlowerBot"  // your bot username without @
                data-size="large"
                data-onauth="handleTelegramAuth(user)"
            ></script>
        </div>
    );
};

export default TelegramAuth;
