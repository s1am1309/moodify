"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

type ExpressionName =
  | "happy"
  | "sad"
  | "angry"
  | "fearful"
  | "disgusted"
  | "surprised"
  | "neutral";

type MoodName =
  | "Positive"
  | "Energized"
  | "Neutral"
  | "Low"
  | "Tense"
  | "Uneasy"
  | "Uncomfortable";

const moodMap: Record<ExpressionName, MoodName> = {
  happy: "Positive",
  surprised: "Energized",
  neutral: "Neutral",
  sad: "Low",
  angry: "Tense",
  fearful: "Uneasy",
  disgusted: "Uncomfortable",
};

const moodEmoji: Record<MoodName, string> = {
  Positive: "😊",
  Energized: "⚡",
  Neutral: "😐",
  Low: "😔",
  Tense: "😠",
  Uneasy: "😟",
  Uncomfortable: "😕",
};

const moodDescription: Record<MoodName, string> = {
  Positive: "You appear to be showing positive expressions.",
  Energized: "You appear alert or highly expressive.",
  Neutral: "Your expression appears relatively neutral.",
  Low: "Your expression appears subdued.",
  Tense: "Your expression appears tense.",
  Uneasy: "Your expression appears concerned.",
  Uncomfortable: "Your expression appears uncomfortable.",
};

const expressionLabels: Record<ExpressionName, string> = {
  happy: "Happy",
  sad: "Sad",
  angry: "Angry",
  fearful: "Fearful",
  disgusted: "Disgusted",
  surprised: "Surprised",
  neutral: "Neutral",
};

export default function DetectPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionLoopRef = useRef<number | null>(null);
  const expressionHistoryRef = useRef<ExpressionName[]>([]);

  const [cameraOn, setCameraOn] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expression, setExpression] =
    useState<ExpressionName>("neutral");

  const [confidence, setConfidence] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoading(true);
        setError("");

        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        await faceapi.nets.faceExpressionNet.loadFromUri("/models");

        setModelsLoaded(true);

        console.log("Face-api models loaded.");
      } catch (err) {
        console.error("Model loading error:", err);

        setError(
          "Could not load the face detection models. Check public/models."
        );
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      setError("");

      if (!modelsLoaded) {
        setError("Models are still loading. Please wait.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraOn(true);
    } catch (err) {
      console.error("Camera error:", err);

      setError(
        "Could not access the camera. Check your browser permissions."
      );
    }
  };

  // Attach camera stream
  useEffect(() => {
    if (!cameraOn || !videoRef.current || !streamRef.current) {
      return;
    }

    const video = videoRef.current;

    video.srcObject = streamRef.current;

    video.onloadedmetadata = () => {
      video.play().catch((err) => {
        console.error("Video playback error:", err);
      });
    };
  }, [cameraOn]);

  // Live expression detection
  useEffect(() => {
    if (!cameraOn || !modelsLoaded || !videoRef.current) {
      return;
    }

    const video = videoRef.current;

    const detect = async () => {
      if (video.readyState >= 2) {
        try {
          const result = await faceapi
            .detectSingleFace(
              video,
              new faceapi.TinyFaceDetectorOptions({
                inputSize: 224,
                scoreThreshold: 0.5,
              })
            )
            .withFaceLandmarks()
            .withFaceExpressions();

          if (result) {
            setFaceDetected(true);

            const expressions = result.expressions;

            const strongest = Object.entries(expressions).sort(
              ([, a], [, b]) => b - a
            )[0];

            if (strongest) {
              const [name, score] = strongest;

              const currentExpression =
                name as ExpressionName;

              // Add to history
              expressionHistoryRef.current.push(
                currentExpression
              );

              // Keep the latest 8 detections
              if (expressionHistoryRef.current.length > 8) {
                expressionHistoryRef.current.shift();
              }

              // Count expressions
              const counts: Record<string, number> = {};

              for (const item of expressionHistoryRef.current) {
                counts[item] =
                  (counts[item] || 0) + 1;
              }

              // Most common expression
              const stableExpression =
                Object.entries(counts).sort(
                  ([, a], [, b]) => b - a
                )[0];

              if (stableExpression) {
                setExpression(
                  stableExpression[0] as ExpressionName
                );
              }

              setConfidence(score);
            }
          } else {
            setFaceDetected(false);
            expressionHistoryRef.current = [];
          }
        } catch (err) {
          console.error("Detection error:", err);
        }
      }

      detectionLoopRef.current =
        requestAnimationFrame(detect);
    };

    detect();

    return () => {
      if (detectionLoopRef.current) {
        cancelAnimationFrame(
          detectionLoopRef.current
        );
      }
    };
  }, [cameraOn, modelsLoaded]);

  // Stop camera when leaving page
  useEffect(() => {
    return () => {
      if (detectionLoopRef.current) {
        cancelAnimationFrame(
          detectionLoopRef.current
        );
      }

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        streamRef.current = null;
      }
    };
  }, []);

  const currentMood = moodMap[expression];

  return (
    <main className="min-h-screen bg-[#050505] text-white">

      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-6 md:px-12">
        <div className="text-xl font-semibold">
          Moodify
        </div>

        {cameraOn && (
          <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/60">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            LIVE
          </div>
        )}
      </nav>

      {/* Main */}
      <section className="flex min-h-[80vh] items-center justify-center px-6">

        <div className="w-full max-w-3xl text-center">

          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">
            Moodify
          </p>

          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Understand your mood.
          </h1>

          <p className="mx-auto mt-5 max-w-lg text-white/50">
            Live facial-expression analysis running locally
            in your browser.
          </p>

          {/* Camera */}
          <div className="relative mx-auto mt-10 aspect-video w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${
                cameraOn ? "block" : "hidden"
              }`}
              style={{
                transform: "scaleX(-1)",
              }}
            />

            {!cameraOn && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div>
                  <div className="mb-4 text-5xl">
                    📷
                  </div>

                  <p className="text-white/30">
                    Camera is currently off
                  </p>
                </div>
              </div>
            )}

            {cameraOn && (
              <div className="absolute left-4 top-4 rounded-full bg-black/60 px-4 py-2 text-sm backdrop-blur">
                <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-green-400" />
                Analyzing
              </div>
            )}
          </div>

          {/* Model status */}
          <div className="mt-6 text-sm text-white/40">
            {loading && "Loading expression model..."}

            {!loading &&
              modelsLoaded &&
              "Expression model ready"}
          </div>

          {/* Start button */}
          {!cameraOn && (
            <button
              onClick={startCamera}
              disabled={!modelsLoaded}
              className="mt-8 rounded-full bg-white px-8 py-4 font-medium text-black transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading
                ? "Loading..."
                : "Start Live Detection"}
            </button>
          )}

          {/* Result */}
          {cameraOn && (
            <div className="mx-auto mt-8 max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8">

              <p className="text-xs uppercase tracking-[0.25em] text-white/30">
                Your current mood
              </p>

              <div className="mt-5 text-7xl">
                {faceDetected
                  ? moodEmoji[currentMood]
                  : "👤"}
              </div>

              <h2 className="mt-5 text-3xl font-semibold">
                {faceDetected
                  ? currentMood
                  : "No face detected"}
              </h2>

              {faceDetected && (
                <>
                  <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/40">
                    {moodDescription[currentMood]}
                  </p>

                  <p className="mt-4 text-sm text-white/30">
                    Expression estimate:{" "}
                    {expressionLabels[expression]}
                  </p>

                  {/* Confidence */}
                  <div className="mt-6">

                    <div className="mb-2 flex justify-between text-xs text-white/30">
                      <span>
                        Confidence
                      </span>

                      <span>
                        {Math.round(
                          confidence * 100
                        )}
                        %
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-white transition-all duration-300"
                        style={{
                          width: `${Math.round(
                            confidence * 100
                          )}%`,
                        }}
                      />
                    </div>

                  </div>
                </>
              )}

            </div>
          )}

          {/* Error */}
          {error && (
            <p className="mx-auto mt-6 max-w-lg text-sm text-red-400">
              {error}
            </p>
          )}

        </div>
      </section>
    </main>
  );
}