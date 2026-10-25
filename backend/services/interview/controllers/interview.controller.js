
import redis from "../../../shared/redis/redis.js";
import graph from "../graph/graph.js";
import Interview from "../models/interview.model.js";
import { sanitizeMonitoringPayload } from "../utils/monitoring.js";

export const startInterview = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];

        const {
            type,
            role,
            useResume = false,
            resume = {},
            questionCount = 5,
        } = req.body;

        if (!type || !role) {
            return res.status(400).json({
                success: false,
                message: "Interview type and role are required",
            });
        }

        const parsedCount = Number(questionCount);
        if (
            isNaN(parsedCount) ||
            !Number.isInteger(parsedCount) ||
            parsedCount < 1 ||
            parsedCount > 15
        ) {
            return res.status(400).json({
                success: false,
                message: "Question count must be an integer between 1 and 15",
            });
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User ID is missing",
            });
        }

        const result = await graph.invoke({
            action: "start",
            role,
            type,
            useResume,
            resume,
            questionCount: parsedCount,
        });

        const questions = result?.questions;

        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(500).json({
                success: false,
                message: "Failed to generate interview questions",
            });
        }

        const interview = await Interview.create({
            userId,
            type,
            role,
            useResume,
            questions,
            currentQuestion: 0,
            status: "in-progress",
            monitoringEvents: [],
            monitoringSummary: {
                pasteCount: 0,
                tabSwitchCount: 0,
                faceAbsentCount: 0,
                headTurnedCount: 0,
                cameraDeniedCount: 0,
            },
        });

        await redis.del(`interviews:${userId}`);

        return res.status(200).json({
            success: true,
            interviewId: interview._id,
            currentQuestion: 0,
            totalQuestions: interview.questions.length,
            question: interview.questions[0],
        });
    } catch (error) {
        console.error("Start Interview Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const submitAnswer = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        const { interviewId, answer, finishEarly = false } = req.body;

        const effectiveAnswer =
            String(answer || "").trim() ||
            (finishEarly ? "Interview concluded early by candidate." : "");

        if (!interviewId || (!finishEarly && !effectiveAnswer)) {
            return res.status(400).json({
                success: false,
                message: "Interview ID and answer are required",
            });
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User ID is missing",
            });
        }

        const interview = await Interview.findOne({
            _id: interviewId,
            userId,
        });

        if (!interview) {
            return res.status(404).json({
                success: false,
                message: "Interview not found",
            });
        }

        if (interview.status === "completed") {
            return res.status(400).json({
                success: false,
                message: "Interview already completed",
            });
        }

        const index = interview.currentQuestion;
        const currentQuestion = interview.questions[index];

        if (!currentQuestion) {
            return res.status(400).json({
                success: false,
                message: "Invalid question index",
            });
        }

        currentQuestion.userAnswer = effectiveAnswer;

        const completed =
            Boolean(finishEarly) ||
            interview.currentQuestion + 1 >= interview.questions.length;

        const result = await graph.invoke({
            action: "feedback",
            question: currentQuestion.question,
            answer,
            difficulty: currentQuestion.difficulty,
            completed,
            role: interview.role,
            type: interview.type,
            questions: interview.questions,
        });

        currentQuestion.feedback = result.feedback;
        interview.currentQuestion++;

        if (completed) {
            interview.status = "completed";
            interview.overallScore = result.report.overallScore;
            interview.summary = result.report.summary;
            interview.strengths = result.report.strengths;
            interview.weaknesses = result.report.weaknesses;
            interview.recommendations = result.report.recommendations;

            await interview.save();
            await redis.del(`interviews:${userId}`);

            return res.status(200).json({
                success: true,
                completed: true,
                interview,
                feedback: result.feedback,
            });
        }

        await interview.save();
        await redis.del(`interviews:${userId}`);

        return res.status(200).json({
            success: true,
            completed: false,
            currentQuestion: interview.currentQuestion,
            question: interview.questions[interview.currentQuestion],
            feedback: result.feedback,
        });
    } catch (error) {
        console.error("Submit Answer Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const recordMonitoring = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        const { interviewId, type, metadata } = req.body || {};

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User ID is missing",
            });
        }

        const payload = sanitizeMonitoringPayload({
            interviewId,
            type,
            metadata,
        });

        if (!payload.ok) {
            return res.status(payload.status).json({
                success: false,
                message: payload.message,
            });
        }

        const interview = await Interview.findOne({
            _id: payload.interviewId,
            userId,
        });

        if (!interview) {
            return res.status(404).json({
                success: false,
                message: "Interview not found",
            });
        }

        if (interview.status === "completed") {
            return res.status(400).json({
                success: false,
                message: "Interview already completed",
            });
        }

        if (!interview.monitoringSummary) {
            interview.monitoringSummary = {
                pasteCount: 0,
                tabSwitchCount: 0,
                faceAbsentCount: 0,
                headTurnedCount: 0,
                cameraDeniedCount: 0,
            };
        }

        if (interview.monitoringEvents.length < payload.maxEvents) {
            interview.monitoringEvents.push({
                type: payload.type,
                timestamp: new Date(),
                metadata: payload.metadata,
            });
        }

        if (payload.countField) {
            interview.monitoringSummary[payload.countField] =
                (interview.monitoringSummary[payload.countField] || 0) + 1;
        }

        interview.markModified("monitoringSummary");
        await interview.save();
        await redis.del(`interviews:${userId}`);

        return res.status(200).json({
            success: true,
            monitoringSummary: interview.monitoringSummary,
        });
    } catch (error) {
        console.error("Record Monitoring Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getInterview = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User ID is missing",
            });
        }

        const interview = await Interview.findOne({
            _id: id,
            userId,
        });

        if (!interview) {
            return res.status(404).json({
                success: false,
                message: "Interview not found",
            });
        }

        return res.status(200).json({
            success: true,
            interview,
        });
    } catch (error) {
        console.error("Get Interview Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getAllInterviews = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User ID is missing",
            });
        }

        const cache = await redis.get(`interviews:${userId}`);

        if (cache) {
            console.log("Data served from Redis");
            return res.status(200).json(JSON.parse(cache));
        }

        const interviews = await Interview.find({ userId }).sort({
            createdAt: -1,
        });

        const completed = interviews.filter(
            (item) => item.status === "completed"
        );

        const totalQuestions = interviews.reduce(
            (sum, item) => sum + item.questions.length,
            0
        );

        const averageScore =
            completed.length > 0
                ? Number(
                    completed.reduce(
                        (sum, item) => sum + (item.overallScore || 0),
                        0
                    ) / completed.length
                ).toFixed(1)
                : 0;

        const stats = {
            totalInterviews: interviews.length,
            totalQuestions,
            completed: completed.length,
            averageScore,
        };

        const getAverageData = (list) => {
            const skills = [
                ["Correctness", "correctness"],
                ["Clarity", "clarity"],
                ["Relevance", "relevance"],
                ["Detail", "detail"],
                ["Efficiency", "efficiency"],
                ["Communication", "communication"],
                ["Problem solving", "problemSolving"],
                ["Creativity", "creativity"],
            ];

            if (!list.length) {
                return skills.map(([skill]) => ({
                    skill,
                    score: 0,
                }));
            }

            const total = Object.fromEntries(
                skills.map(([, key]) => [key, 0])
            );

            list.forEach((interview) => {
                interview.questions.forEach((question) => {
                    skills.forEach(([, key]) => {
                        total[key] += question.feedback?.[key] || 0;
                    });
                });
            });

            const count = list.reduce(
                (sum, item) => sum + item.questions.length,
                0
            );

            if (count === 0) {
                return skills.map(([skill]) => ({
                    skill,
                    score: 0,
                }));
            }

            return skills.map(([skill, key]) => ({
                skill,
                score: Math.round(total[key] / count),
            }));
        };

        const technicalInterviews = completed.filter(
            (item) => item.type === "technical"
        );

        const hrInterviews = completed.filter(
            (item) => item.type === "hr"
        );

        const technicalData = getAverageData(technicalInterviews);
        const hrData = getAverageData(hrInterviews);

        const technicalCount = technicalInterviews.length;
        const hrCount = hrInterviews.length;

        const payload = {
            success: true,
            interviews,
            stats,
            technicalData,
            hrData,
            technicalCount,
            hrCount,
        };

        await redis.set(
            `interviews:${userId}`,
            JSON.stringify(payload),
            "EX",
            600
        );

        return res.status(200).json(payload);
    } catch (error) {
        console.error("Get All Interviews Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
