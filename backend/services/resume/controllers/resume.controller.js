
import redis from "../../../shared/redis/redis.js";
import { resumeAgent } from "../agents/resume.agent.js";
import extractText from "../config/pdf.js";
import Resume from "../models/resume.model.js";
import fs from "node:fs/promises";

// Upload and analyze resume
export const uploadResume = async (req, res) => {
    const file = req.file;

    try {
        // 1. Validate uploaded PDF
        if (!file) {
            return res.status(400).json({
                success: false,
                message: "Resume PDF is required",
            });
        }

        const userId = req.headers["x-user-id"];

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "UserId is required",
            });
        }

        // 2. Extract text from PDF
        const resumeText = await extractText(file.path);

        if (!resumeText || !resumeText.trim()) {
            return res.status(400).json({
                success: false,
                message: "Could not extract text from the PDF",
            });
        }

        // 3. Analyze resume using AI agent
        const aiResponse = await resumeAgent(resumeText);

        // 4. Parse AI response
        let resumeData;

        if (typeof aiResponse === "string") {
            // Handle JSON optionally wrapped in a Markdown code block
            const cleanedResponse = aiResponse
                .replace(/^```(?:json)?\s*/i, "")
                .replace(/\s*```$/, "")
                .trim();

            resumeData = JSON.parse(cleanedResponse);
        } else {
            resumeData = aiResponse;
        }

        if (
            !resumeData ||
            typeof resumeData !== "object" ||
            Array.isArray(resumeData)
        ) {
            throw new Error("AI agent returned invalid resume data");
        }

        // 5. Save or update resume in MongoDB
        let resume = await Resume.findOne({ userId });

        if (resume) {
            Object.assign(resume, {
                ...resumeData,
                extractedText: resumeText,
            });

            await resume.save();
        } else {
            resume = await Resume.create({
                userId,
                extractedText: resumeText,
                ...resumeData,
            });
        }

        // 6. Cache the saved resume in Redis
        await redis.set(
            `resume:${userId}`,
            JSON.stringify(resume.toObject())
        );

        return res.status(200).json({
            success: true,
            message: "Resume analyzed successfully",
            data: resume,
        });
    } catch (error) {
        console.error("Resume upload error:", error);

        return res.status(500).json({
            success: false,
            message: "Resume analysis failed",
        });
    } finally {
        // 7. Delete temporary PDF after processing, whether successful or not
        if (file?.path) {
            try {
                await fs.unlink(file.path);
            } catch (cleanupError) {
                if (cleanupError.code !== "ENOENT") {
                    console.error(
                        "PDF cleanup failed:",
                        cleanupError.message
                    );
                }
            }
        }
    }
};

// Get the current user's analyzed resume
export const getResume = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "UserId is required",
            });
        }

        // 1. Try Redis cache first
        const cachedResume = await redis.get(`resume:${userId}`);

        if (cachedResume) {
            return res.status(200).json({
                success: true,
                message: "Resume retrieved successfully",
                data: JSON.parse(cachedResume),
            });
        }

        // 2. If not cached, fetch from MongoDB
        const resume = await Resume.findOne({ userId });

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found",
            });
        }

        // 3. Populate Redis cache
        await redis.set(
            `resume:${userId}`,
            JSON.stringify(resume.toObject())
        );

        return res.status(200).json({
            success: true,
            message: "Resume retrieved successfully",
            data: resume,
        });
    } catch (error) {
        console.error("Get resume error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve resume",
        });
    }
};
