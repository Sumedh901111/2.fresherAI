import { useCallback, useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { recordMonitoring } from "../apis/interview.api";

const FACE_ABSENT_MS = 2500;
const HEAD_TURN_MS = 3500;
const MEDIAPIPE_WASM =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm";
const FACE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const INTERVIEW_POLICY = {
  prohibitAnswerPaste: true,
};

function estimateHeadDirection(landmarks, matrix) {
  const fromMatrix = directionFromMatrix(matrix);
  if (fromMatrix) return fromMatrix;
  if (!landmarks?.length) return "forward";

  const nose = landmarks[1];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const forehead = landmarks[10];
  const chin = landmarks[152];
  if (!nose || !leftEye || !rightEye || !forehead || !chin) return "forward";

  const eyeMidX = (leftEye.x + rightEye.x) / 2;
  const yaw = nose.x - eyeMidX;
  const faceHeight = chin.y - forehead.y || 1;
  const pitch = (nose.y - (forehead.y + chin.y) / 2) / faceHeight;

  if (Math.abs(yaw) > 0.045) return yaw > 0 ? "right" : "left";
  if (pitch < -0.12) return "up";
  if (pitch > 0.16) return "down";
  return "forward";
}

function directionFromMatrix(matrix) {
  if (!matrix?.data || matrix.data.length < 16) return null;
  const d = matrix.data;
  const r00 = d[0];
  const r20 = d[8];
  const r21 = d[9];
  const r22 = d[10];
  const yaw = Math.atan2(-r20, r00);
  const pitch = Math.atan2(r21, r22);
  if (Math.abs(yaw) > 0.45) return yaw > 0 ? "left" : "right";
  if (pitch < -0.4) return "up";
  if (pitch > 0.4) return "down";
  return "forward";
}

function cameraFailureStatus(error) {
  const name = error?.name || "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return {
      status: "denied",
      message: "Camera permission denied. Enable it in the browser to continue monitoring.",
      type: "camera_denied",
    };
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return {
      status: "unavailable",
      message: "No camera was found on this device.",
      type: "camera_unavailable",
    };
  }
  return {
    status: "error",
    message: "Camera could not be started. Another app may be using it.",
    type: "camera_error",
  };
}

export function useInterviewMonitoring({ interviewId, userVideoRef }) {
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraStatus, setCameraStatus] = useState("off");
  const [cameraMessage, setCameraMessage] = useState("");
  const [faceDetected, setFaceDetected] = useState(true);
  const [headDirection, setHeadDirection] = useState("forward");
  const [warning, setWarning] = useState("");
  const [pasteCount, setPasteCount] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [faceAbsentCount, setFaceAbsentCount] = useState(0);

  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const faceAbsentSinceRef = useRef(null);
  const faceAbsentRecordedRef = useRef(false);
  const headAwaySinceRef = useRef(null);
  const headAwayRecordedRef = useRef(false);
  const hiddenAtRef = useRef(null);
  const lastSentRef = useRef({});
  const warningTimerRef = useRef(null);
  const mountedRef = useRef(true);
  const cameraGenRef = useRef(0);

  const showWarning = useCallback((message) => {
    setWarning(message);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    warningTimerRef.current = setTimeout(() => {
      if (mountedRef.current) setWarning("");
    }, 6000);
  }, []);

  const sendEvent = useCallback(
    async (type, metadata = {}, options = {}) => {
      if (!interviewId) return;
      const now = Date.now();
      const debounceMs = options.debounceMs ?? 0;
      if (debounceMs && lastSentRef.current[type] && now - lastSentRef.current[type] < debounceMs) {
        return;
      }
      lastSentRef.current[type] = now;
      await recordMonitoring({
        interviewId,
        type,
        metadata,
      });
    },
    [interviewId]
  );

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    try {
      landmarkerRef.current?.close?.();
    } catch {
      /* landmarker may already be closed */
    }
    landmarkerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (userVideoRef.current) userVideoRef.current.srcObject = null;
    faceAbsentSinceRef.current = null;
    faceAbsentRecordedRef.current = false;
    headAwaySinceRef.current = null;
    headAwayRecordedRef.current = false;
    if (mountedRef.current) {
      setCameraOn(false);
      setCameraStatus("off");
      setFaceDetected(true);
      setHeadDirection("forward");
    }
  }, [userVideoRef]);

  const detectLoop = useCallback(() => {
    const video = userVideoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    let result;
    try {
      result = landmarker.detectForVideo(video, performance.now());
    } catch {
      rafRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    const landmarks = result?.faceLandmarks?.[0];
    const present = Boolean(landmarks?.length);
    const now = Date.now();

    if (present) {
      if (faceAbsentRecordedRef.current) {
        sendEvent("face_returned", { source: "camera" });
      }
      faceAbsentSinceRef.current = null;
      faceAbsentRecordedRef.current = false;
      if (mountedRef.current) setFaceDetected(true);

      const direction = estimateHeadDirection(
        landmarks,
        result?.facialTransformationMatrixes?.[0]
      );
      if (mountedRef.current) setHeadDirection(direction);

      if (direction !== "forward") {
        if (!headAwaySinceRef.current) headAwaySinceRef.current = now;
        if (!headAwayRecordedRef.current && now - headAwaySinceRef.current >= HEAD_TURN_MS) {
          headAwayRecordedRef.current = true;
          showWarning("Please face the camera. Looking away was noted.");
          sendEvent("head_turned", { direction, source: "camera" }, { debounceMs: 8000 });
        }
      } else {
        headAwaySinceRef.current = null;
        headAwayRecordedRef.current = false;
      }
    } else {
      if (!faceAbsentSinceRef.current) faceAbsentSinceRef.current = now;
      if (mountedRef.current) {
        setFaceDetected(false);
        setHeadDirection("forward");
      }
      if (!faceAbsentRecordedRef.current && now - faceAbsentSinceRef.current >= FACE_ABSENT_MS) {
        faceAbsentRecordedRef.current = true;
        setFaceAbsentCount((count) => count + 1);
        showWarning("Your face is not in the camera frame. Please stay visible.");
        sendEvent("face_absent", {
          absentMs: now - faceAbsentSinceRef.current,
          source: "camera",
        });
      }
    }

    rafRef.current = requestAnimationFrame(detectLoop);
  }, [sendEvent, showWarning, userVideoRef]);

  const startFaceLandmarker = useCallback(async () => {
    const create = (delegate) =>
      FilesetResolver.forVisionTasks(MEDIAPIPE_WASM).then((fileset) =>
        FaceLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: FACE_MODEL,
            delegate,
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFacialTransformationMatrixes: true,
        })
      );

    try {
      let landmarker;
      try {
        landmarker = await create("GPU");
      } catch {
        landmarker = await create("CPU");
      }
      if (!mountedRef.current || !streamRef.current) {
        landmarker.close();
        return;
      }
      landmarkerRef.current = landmarker;
      rafRef.current = requestAnimationFrame(detectLoop);
    } catch {
      if (mountedRef.current) {
        setCameraMessage(
          "Camera is on. Face monitoring could not load in this browser."
        );
      }
    }
  }, [detectLoop]);

  const toggleCamera = useCallback(async () => {
    if (cameraOn || cameraStatus === "requesting") {
      cameraGenRef.current += 1;
      stopCamera();
      setCameraMessage("");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("unavailable");
      setCameraMessage("This browser does not support webcam access.");
      showWarning("Webcam access is not available in this browser.");
      sendEvent("camera_unavailable", { reason: "no_getUserMedia" });
      return;
    }

    setCameraStatus("requesting");
    setCameraMessage("Requesting camera permission…");
    const generation = ++cameraGenRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 360 } },
        audio: false,
      });
      if (!mountedRef.current || generation !== cameraGenRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      setCameraOn(true);
      setCameraStatus("on");
      setCameraMessage("");
      setFaceDetected(true);

      const attach = () => {
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
          userVideoRef.current.play?.().catch(() => {});
        }
      };
      attach();
      requestAnimationFrame(attach);
      await startFaceLandmarker();
    } catch (error) {
      const failure = cameraFailureStatus(error);
      setCameraOn(false);
      setCameraStatus(failure.status);
      setCameraMessage(failure.message);
      showWarning(failure.message);
      sendEvent(failure.type, { reason: error?.name || "unknown" });
    }
  }, [
    cameraOn,
    cameraStatus,
    sendEvent,
    showWarning,
    startFaceLandmarker,
    stopCamera,
    userVideoRef,
  ]);

  const handleAnswerPaste = useCallback(
    (event) => {
      if (INTERVIEW_POLICY.prohibitAnswerPaste) {
        event.preventDefault();
      }
      setPasteCount((count) => count + 1);
      showWarning(
        INTERVIEW_POLICY.prohibitAnswerPaste
          ? "Pasting into the answer box is not allowed. Type your response."
          : "Paste detected. Please write the answer in your own words."
      );
      sendEvent("paste", { source: "answer_input" });
    },
    [sendEvent, showWarning]
  );

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
        return;
      }
      if (hiddenAtRef.current == null) return;
      const durationMs = Date.now() - hiddenAtRef.current;
      hiddenAtRef.current = null;
      setTabSwitchCount((count) => count + 1);
      showWarning(
        "You left this tab. Please stay on the interview page. Browser checks cannot catch every form of cheating."
      );
      sendEvent("tab_switch", { durationMs, source: "visibilitychange" });
    };

    const onBlur = () => {
      sendEvent(
        "window_blur",
        { source: "window_blur" },
        { debounceMs: 8000 }
      );
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
    };
  }, [sendEvent, showWarning]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      stopCamera();
    };
  }, [stopCamera]);

  return {
    cameraOn,
    cameraStatus,
    cameraMessage,
    faceDetected,
    headDirection,
    warning,
    pasteCount,
    tabSwitchCount,
    faceAbsentCount,
    toggleCamera,
    stopMonitoring: stopCamera,
    handleAnswerPaste,
  };
}
