
import api from "../utils/axios";

const handleApiError = (operation, error) => {
    console.error(
        `${operation} failed:`,
        error.response?.status,
        error.response?.data || error.message
    );
    return null;
};

export const startInterview = async (data) => {
    try {
        const response = await api.post("/api/interview/start", data);
        return response.data;
    } catch (error) {
        return handleApiError("Start interview", error);
    }
};

export const getInterview = async (id) => {
    try {
        const response = await api.get(`/api/interview/${id}`);
        return response.data;
    } catch (error) {
        return handleApiError("Get interview", error);
    }
};

export const submitAnswer = async (data) => {
    try {
        const response = await api.post("/api/interview/answer", data);
        return response.data;
    } catch (error) {
        return handleApiError("Submit answer", error);
    }
};

export const getAllInterviews = async () => {
    try {
        const response = await api.get("/api/interview/all");
        return response.data;
    } catch (error) {
        return handleApiError("Get all interviews", error);
    }
};
export const recordMonitoring = async (data) => {
    try {
        const response = await api.post("/api/interview/monitor", data);
        return response.data;
    } catch (error) {
        return handleApiError("Record monitoring", error);
    }
};