
import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const mongoUrl = process.env.MONGODB_URL;

        if (!mongoUrl) {
            throw new Error("MONGODB_URL is missing from the environment");
        }

        await mongoose.connect(mongoUrl, {
            serverSelectionTimeoutMS: 15000,
            connectTimeoutMS: 15000,
        });

        console.log("MongoDB connected successfully");
        console.log("MongoDB ready state:", mongoose.connection.readyState);
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        throw error;
    }
};
