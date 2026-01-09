import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

// Vercel serverless uses default export
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const userData = await new Promise((resolve, reject) => {
            let body = "";
            req.on("data", chunk => body += chunk);
            req.on("end", () => resolve(JSON.parse(body)));
            req.on("error", reject);
        });

        // Verify Telegram hash (simple example)
        const { id, first_name, username, hash } = userData;

        // TODO: Add Telegram hash verification here
        // For dev/testing you can skip for now

        // Connect to Supabase
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );

        // Upsert user into Supabase table "users"
        await supabase.from("users").upsert({
            telegram_id: id,
            username,
            first_name
        });

        // Create JWT
        const token = jwt.sign(
            { id, username },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
}
