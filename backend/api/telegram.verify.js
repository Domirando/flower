import crypto from "crypto";

export function verifyTelegramLogin(data) {
    const { hash, ...rest } = data;

    const secret = crypto
        .createHash("sha256")
        .update(process.env.TELEGRAM_BOT_TOKEN)
        .digest();

    const checkString = Object.keys(rest)
        .sort()
        .map(k => `${k}=${rest[k]}`)
        .join("\n");

    const hmac = crypto
        .createHmac("sha256", secret)
        .update(checkString)
        .digest("hex");

    return hmac === hash;
}
