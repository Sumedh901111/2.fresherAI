
import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import interviewRouter from "./routes/interview.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 6003;

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello from Interview-service");
});

app.use("/", interviewRouter);

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Interview-service Started on ${PORT}`);
        });
    } catch (error) {
        console.error(
            "Interview service startup failed:",
            error.message
        );
        process.exit(1);
    }
};

startServer();
