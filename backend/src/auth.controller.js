import jwt from "jsonwebtoken";
import { supabase } from "./supabase.js";
import { verifyTelegramLogin } from "./telegram.verify.js";

export async function telegramLogin(req, res) {
    const isValid = verifyTelegramLogin(req.body);
    if (!isValid) return res.status(401).json({ error: "Invalid Telegram auth" });

    const { id, username, first_name, photo_url } = req.body;

    // Upsert user into Supabase
    const { data, error } = await supabase
        .from("users")
        .upsert({
            telegram_id: id.toString(),
            username,
            first_name,
            photo_url
        })
        .select()
        .single();

    if (error) return res.status(500).json(error);

    // Generate JWT
    const token = jwt.sign(
        { userId: data.id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    res.json({ token, user: data });
}
