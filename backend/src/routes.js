import express from "express";
import { telegramLogin } from "./auth.controller.js";

const router = express.Router();
router.post("/auth/telegram", telegramLogin);

export default router;
