import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./api/server.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", routes);

app.listen(process.env.PORT, () =>
    console.log(`Flower backend running on port ${process.env.PORT}`)
);
