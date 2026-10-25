
import llm from "../config/llm.js";
import hrInterviewPrompt from "../prompts/hrInterviewPrompt.js";
import technicalInterviewPrompt from "../prompts/technicalInterviewPrompt.js";

export const interviewAgent = async (data) => {
    try {
        const prompt =
            data.type?.toLowerCase() === "hr"
                ? hrInterviewPrompt(data)
                : technicalInterviewPrompt(data);

        const response = await llm.invoke(prompt);

        const cleaned = response.content
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const parsed = JSON.parse(cleaned);
        const questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);

        const targetCount = Number(data.questionCount);
        if (targetCount && targetCount > 0 && questions.length > targetCount) {
            return questions.slice(0, targetCount);
        }

        return questions;
    } catch (error) {
        console.error("Interview Agent Error:", error.message);
        throw new Error(
            `Failed to generate interview questions: ${error.message}`
        );
    }
};
