import { describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { sanitizeMonitoringPayload, MONITORING_EVENT_TYPES } from "./monitoring.js";

describe("sanitizeMonitoringPayload", () => {
    const interviewId = new mongoose.Types.ObjectId().toString();

    it("rejects missing or invalid interview ids", () => {
        const missing = sanitizeMonitoringPayload({ type: "paste" });
        assert.equal(missing.ok, false);
        assert.equal(missing.status, 400);

        const invalid = sanitizeMonitoringPayload({
            interviewId: "not-an-id",
            type: "paste",
        });
        assert.equal(invalid.ok, false);
    });

    it("rejects unknown event types", () => {
        const result = sanitizeMonitoringPayload({
            interviewId,
            type: "cheating_detected",
        });
        assert.equal(result.ok, false);
        assert.equal(result.message, "Invalid monitoring event type");
    });

    it("accepts allowed types and strips clipboard contents", () => {
        for (const type of MONITORING_EVENT_TYPES) {
            const result = sanitizeMonitoringPayload({
                interviewId,
                type,
                metadata: {
                    clipboard: "secret pasted text",
                    content: "do not store",
                    durationMs: 1200.7,
                    source: "answer_input",
                    extra: "drop me",
                },
            });
            assert.equal(result.ok, true);
            assert.equal(result.type, type);
            assert.equal(result.metadata.clipboard, undefined);
            assert.equal(result.metadata.content, undefined);
            assert.equal(result.metadata.extra, undefined);
            assert.equal(result.metadata.durationMs, 1201);
            assert.equal(result.metadata.source, "answer_input");
        }
    });

    it("maps countable events to summary fields", () => {
        const paste = sanitizeMonitoringPayload({ interviewId, type: "paste" });
        assert.equal(paste.countField, "pasteCount");

        const blur = sanitizeMonitoringPayload({
            interviewId,
            type: "window_blur",
        });
        assert.equal(blur.countField, null);
    });
});
