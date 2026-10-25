import mongoose from "mongoose";


const feedbackSchema = new mongoose.Schema(
    {
        score: {
            type: Number,
            default: 0,
        },

        correctness: {
            type: Number,
            default: 0,
        },

        clarity: {
            type: Number,
            default: 0,
        },

        relevance: {
            type: Number,
            default: 0,
        },

        detail: {
            type: Number,
            default: 0,
        },

        efficiency: {
            type: Number,
            default: 0,
        },

        communication: {
            type: Number,
            default: 0,
        },

        problemSolving: {
            type: Number,
            default: 0,
        },

        creativity: {
            type: Number,
            default: 0,
        },

        feedback: {
            type: String,
            default: "",
        },

        improvements: {
            type: [String],
            default: [],
        },
    },
    { _id: false }
);

const questionSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: true,
        },
        userAnswer: {
            type: String,
            default: "",
        },

        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            default: "easy",
        },

        timer: {
            type: Number,
            default: 60,
        },

        feedback: {
            type: feedbackSchema,
            default: () => ({}),
        },
    },
    { _id: false }
);

const monitoringEventSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: [
                "paste",
                "tab_switch",
                "face_absent",
                "face_returned",
                "head_turned",
                "camera_denied",
                "camera_unavailable",
                "camera_error",
                "window_blur",
            ],
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    { _id: false }
);

const interviewSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true,
        },

        type: {
            type: String,
            enum: ["hr", "technical"],
            required: true,
        },

        role: {
            type: String,
            required: true,
        },
        useResume: {
            type: Boolean,
            default: false,
        },

        currentQuestion: {
            type: Number,
            default: 0,
        },

        questions: {
            type: [questionSchema],
            default: [],
        },

        overallScore: {
            type: Number,
            default: 0,
        },

        strengths: {
            type: [String],
            default: [],
        },

        weaknesses: {
            type: [String],
            default: [],
        },

        recommendations: {
            type: [String],
            default: [],
        },

        summary: {
            type: String,
            default: "",
        },

        monitoringEvents: {
            type: [monitoringEventSchema],
            default: [],
        },

        monitoringSummary: {
            pasteCount: { type: Number, default: 0 },
            tabSwitchCount: { type: Number, default: 0 },
            faceAbsentCount: { type: Number, default: 0 },
            headTurnedCount: { type: Number, default: 0 },
            cameraDeniedCount: { type: Number, default: 0 },
        },

        status: {
            type: String,
            enum: ["in-progress", "completed"],
            default: "in-progress",
        },
    },
    {
        timestamps: true,
    }
);

const Interview = mongoose.model("Interview" , interviewSchema)

export default Interview