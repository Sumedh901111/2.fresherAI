

// pdf  ---->  pdf Storage  ---> text ---> llm ---> agent ---> promt ---> data ---> save mongoDb ---> redis -->pdf delete ---> resume data ( score , missing skills , recommen.)

import redis from "../../../shared/redis/redis.js";
import { resumeAgent } from "../agents/resume.agent.js";
import extractText from "../config/pdf.js";
import Resume from "../models/resume.model.js";
import fs from "fs"



export const uploadResume = async (req, res) => {
    const file = req.file; // Declare outside try so catch can access it

    try {
        if (!file) {
            return res.status(400).json({
                success: false,
                message: "Resume PDF is required"
            });
        }

        const userId = req.headers["x-user-id"];

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "UserId is required"
            });
        }

        // 1. Extract text from uploaded PDF
        const resumeText = await extractText(file.path);

        if (!resumeText || !resumeText.trim()) {
            return res.status(400).json({
                success: false,
                message: "Could not extract text from the PDF"
            });
        }

        // 2. Analyze resume using AI agent
        const aiResponse = await resumeAgent(resumeText);

        // 3. Parse AI response
        const resumeData =
            typeof aiResponse === "string"
                ? JSON.parse(aiResponse)
                : aiResponse;

        // 4. Save resume in MongoDB
        let resume = await Resume.findOne({ userId });

        if (resume) {
            Object.assign(resume, {
                ...resumeData,
                extractedText: resumeText
            });

            await resume.save();
        } else {
            resume = await Resume.create({
                userId,
                extractedText: resumeText,
                ...resumeData
            });
        }

        // 5. Cache resume in Redis
        await redis.set(
            `resume:${userId}`,
            JSON.stringify(resume)
        );

        // 6. Delete temporary PDF after successful processing
        await fs.promises.unlink(file.path).catch((err) => {
            if (err.code !== "ENOENT") {
                console.error("PDF cleanup failed:", err.message);
            }
        });

        // 7. Return analyzed resume
        return res.status(200).json({
            success: true,
            message: "Resume analyzed successfully",
            data: resume
        });

    } catch (error) {
        console.error("Resume upload error:", error);

        // Clean up temporary PDF if processing fails
        if (file?.path) {
            await fs.promises.unlink(file.path).catch((cleanupError) => {
                if (cleanupError.code !== "ENOENT") {
                    console.error(
                        "PDF cleanup failed:",
                        cleanupError.message
                    );
                }
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || "Resume analysis failed"
        });
    }
};
