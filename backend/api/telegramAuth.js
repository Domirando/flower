// telegramAuth.js
import crypto from "crypto";

export function verifyTelegramAuth(data) {
    const secret = crypto
        .createHash("sha256")
        .update(process.env.TELEGRAM_BOT_TOKEN)
        .digest();

    const checkString = Object.keys(data)
        .filter((key) => key !== "hash")
        .sort()
        .map((key) => `${key}=${data[key]}`)
        .join("\n");

    const hmac = crypto
        .createHmac("sha256", secret)
        .update(checkString)
        .digest("hex");

    return hmac === data.hash;
}
