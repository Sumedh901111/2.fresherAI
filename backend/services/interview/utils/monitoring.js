import mongoose from "mongoose";

export const MONITORING_EVENT_TYPES = [
    "paste",
    "tab_switch",
    "face_absent",
    "face_returned",
    "head_turned",
    "camera_denied",
    "camera_unavailable",
    "camera_error",
    "window_blur",
];

const COUNT_FIELDS = {
    paste: "pasteCount",
    tab_switch: "tabSwitchCount",
    face_absent: "faceAbsentCount",
    head_turned: "headTurnedCount",
    camera_denied: "cameraDeniedCount",
};

const ALLOWED_METADATA_KEYS = new Set([
    "durationMs",
    "absentMs",
    "source",
    "reason",
    "direction",
    "cameraOn",
]);

const BLOCKED_METADATA_KEYS = /clipboard|content|text|image|screenshot|answer|password|secret/i;

const MAX_EVENTS = 300;
const MAX_STRING = 80;

export function sanitizeMonitoringPayload({ interviewId, type, metadata }) {
    if (!interviewId || !mongoose.Types.ObjectId.isValid(interviewId)) {
        return {
            ok: false,
            status: 400,
            message: "A valid interview ID is required",
        };
    }

    if (!MONITORING_EVENT_TYPES.includes(type)) {
        return {
            ok: false,
            status: 400,
            message: "Invalid monitoring event type",
        };
    }

    const cleanMetadata = {};
    if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
        for (const [key, value] of Object.entries(metadata)) {
            if (BLOCKED_METADATA_KEYS.test(key)) continue;
            if (!ALLOWED_METADATA_KEYS.has(key)) continue;
            if (typeof value === "number" && Number.isFinite(value)) {
                cleanMetadata[key] = Math.round(value);
            } else if (typeof value === "boolean") {
                cleanMetadata[key] = value;
            } else if (typeof value === "string") {
                cleanMetadata[key] = value.slice(0, MAX_STRING);
            }
        }
    }

    return {
        ok: true,
        interviewId,
        type,
        metadata: cleanMetadata,
        countField: COUNT_FIELDS[type] || null,
        maxEvents: MAX_EVENTS,
    };
}
