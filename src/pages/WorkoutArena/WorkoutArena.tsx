import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Info,
  LoaderCircle,
  Pause,
  Play,
  Square,
  Video,
  XCircle,
} from "lucide-react";
import { EXERCISES, getExercise } from "../../data/exercises";
import {
  Card,
  SectionTitle,
  Stat,
  DemoTag,
  ProgressBar,
} from "../../components/ui/Primitives";
import { useApp } from "../../features/store/StoreProvider";
import type { WorkoutSession } from "../../types";
import type { PoseVerifier } from "../../services/interfaces/poseVerifier";
import { noOpVerifier } from "../../services/interfaces/poseVerifier";

const CATEGORY_TABS = [
  { id: "all", label: "All" },
  { id: "strength", label: "Strength" },
  { id: "core", label: "Core" },
  { id: "cardio", label: "Cardio" },
  { id: "mobility", label: "Mobility" },
] as const;

export default function WorkoutArena() {
  const { state, store } = useApp();
  const [category, setCategory] =
    useState<(typeof CATEGORY_TABS)[number]["id"]>("all");
  const [exerciseId, setExerciseId] = useState("pushup");
  const ex = getExercise(exerciseId);

  // session state
  const [phase, setPhase] = useState<"idle" | "running" | "paused" | "done">(
    "idle",
  );
  const [count, setCount] = useState(0); // reps or seconds
  const [elapsed, setElapsed] = useState(0);
  const [summary, setSummary] = useState<WorkoutSession | null>(null);
  const [manualInput, setManualInput] = useState("");

  // camera state
  const [camStatus, setCamStatus] = useState<
    "off" | "requesting" | "on" | "denied" | "unavailable"
  >("off");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const verifier: PoseVerifier = useMemo(() => noOpVerifier, []);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ticking timer
  useEffect(() => {
    if (phase !== "running") return;
    timerRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
      if (ex.unit === "second") setCount((c) => c + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, ex.unit]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamStatus("off");
  }, []);

  // stop camera on unmount / leaving workout
  useEffect(() => stopCamera, [stopCamera]);

  const startCamera = async () => {
    setCamStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setCamStatus("on");
    } catch (err) {
      const name = (err as DOMException).name;
      setCamStatus(
        name === "NotAllowedError" || name === "SecurityError"
          ? "denied"
          : "unavailable",
      );
    }
  };

  const rewardPreview = useMemo(() => {
    const q = manualInput ? parseInt(manualInput, 10) || 0 : count;
    return {
      xp: Math.round(ex.xpPerUnit * q),
      strength: Math.round(ex.strengthPerUnit * q * 10) / 10,
      coins: Math.round(ex.coinsPerUnit * q),
      q,
    };
  }, [ex, count, manualInput]);

  const startSession = () => {
    setSummary(null);
    setCount(0);
    setElapsed(0);
    setManualInput("");
    setPhase("running");
    store.notify(
      "Workout started",
      `${ex.name} — demo mode, verification not connected.`,
      "info",
    );
  };

  const finishSession = () => {
    const q = manualInput ? parseInt(manualInput, 10) || 0 : count;
    if (q <= 0) {
      store.notify(
        "Nothing recorded",
        "Zero quantity — no rewards awarded.",
        "warning",
      );
      setPhase("idle");
      return;
    }
    const session = store.recordWorkout({
      exerciseId: ex.id,
      quantity: q,
      kind: "demo", // Camera Preview — Verification Not Connected → demo data
      durationSec: Math.max(1, elapsed),
    });
    setSummary(session);
    setPhase("done");
    stopCamera();
  };

  const cancelSession = () => {
    // Cancelled workouts award NOTHING.
    stopCamera();
    setPhase("idle");
    setCount(0);
    setElapsed(0);
    setManualInput("");
    store.notify(
      "Workout cancelled",
      "Cancelled sessions award no rewards in this demo.",
      "warning",
    );
  };

  void verifier; // reserved: future MediaPipe hook-up point

  const filtered = EXERCISES.filter(
    (e) => category === "all" || e.category === category,
  );
  const isRep = ex.unit === "rep";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-100">
            Workout Arena
          </h1>
          <p className="text-sm text-gray-500">
            Every repetition feeds your warrior — and your kingdom.
          </p>
        </div>
        <DemoTag>
          Camera Preview — Verification Not Connected · Demo Workout Mode
        </DemoTag>
      </div>

      {/* Exercise selection */}
      <Card>
        <SectionTitle>Choose your exercise</SectionTitle>
        <div className="mb-4 flex flex-wrap gap-2">
          {CATEGORY_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setCategory(t.id)}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${category === t.id ? "border-lime/60 bg-lime/15 text-lime" : "border-white/10 text-gray-400 hover:bg-white/5"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((e) => (
            <button
              key={e.id}
              onClick={() => {
                if (phase === "idle" || phase === "done") {
                  setExerciseId(e.id);
                  setSummary(null);
                  setPhase("idle");
                }
              }}
              className={`rounded-xl border p-3.5 text-left transition ${exerciseId === e.id ? "border-lime/60 bg-lime/10" : "border-white/10 bg-graphite/60 hover:bg-white/5"} ${phase === "running" || phase === "paused" ? "opacity-50" : ""}`}
            >
              <div className="font-semibold text-gray-200">{e.name}</div>
              <div className="mt-0.5 text-xs text-gray-500">
                {e.xpPerUnit} XP · {e.coinsPerUnit} FM /{" "}
                {e.unit === "rep" ? "rep" : "sec"}
              </div>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Camera + controls */}
        <Card className="lg:col-span-3">
          <SectionTitle right={<DemoTag />}>Training ground</SectionTitle>

          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`h-full w-full object-cover ${camStatus === "on" ? "" : "hidden"}`}
            />
            {camStatus === "on" && (
              <div className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-yellow-400">
                Camera Preview — Verification Not Connected
              </div>
            )}
            {camStatus === "requesting" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-400">
                <LoaderCircle className="animate-spin" size={30} /> Requesting
                camera…
              </div>
            )}
            {(camStatus === "off" ||
              camStatus === "denied" ||
              camStatus === "unavailable") && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                {camStatus === "denied" ? (
                  <XCircle size={30} className="text-red-400" />
                ) : camStatus === "unavailable" ? (
                  <CameraOff size={30} className="text-gray-500" />
                ) : (
                  <Camera size={30} className="text-gray-500" />
                )}
                <p className="text-sm text-gray-400">
                  {camStatus === "denied"
                    ? "Camera permission denied. You can still complete demo workouts without the camera."
                    : camStatus === "unavailable"
                      ? "No usable camera was found on this device. Demo workouts still work."
                      : "Camera is off. Enable it to see a live preview (pose estimation not connected yet)."}
                </p>
                {camStatus !== "denied" && camStatus !== "unavailable" && (
                  <button className="btn-primary text-sm" onClick={startCamera}>
                    <Video size={16} /> Enable camera
                  </button>
                )}
              </div>
            )}
          </div>

          {camStatus === "on" && (
            <button
              className="btn-ghost mt-3 w-full text-sm"
              onClick={stopCamera}
            >
              <CameraOff size={15} /> Stop camera
            </button>
          )}

          {/* Counter + controls */}
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat
              label={isRep ? "Repetitions" : "Seconds"}
              value={manualInput ? `${manualInput} (manual)` : count}
              accent="text-lime"
            />
            <Stat
              label="Elapsed"
              value={`${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`}
            />
            <Stat
              label="XP preview"
              value={rewardPreview.xp}
              accent="text-gray-100"
            />
            <Stat
              label="FM preview"
              value={rewardPreview.coins}
              accent="text-royalbright"
            />
          </div>

          {phase === "running" && isRep && (
            <button
              className="btn-royal mt-4 w-full text-lg font-bold"
              onClick={() => setCount((c) => c + 1)}
            >
              COUNT REP ({count})
            </button>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            {(phase === "idle" || phase === "done") && (
              <button className="btn-primary flex-1" onClick={startSession}>
                <Play size={17} /> Start {ex.name}
              </button>
            )}
            {phase === "running" && (
              <button
                className="btn-ghost flex-1"
                onClick={() => setPhase("paused")}
              >
                <Pause size={16} /> Pause
              </button>
            )}
            {phase === "paused" && (
              <button
                className="btn-primary flex-1"
                onClick={() => setPhase("running")}
              >
                <Play size={16} /> Resume
              </button>
            )}
            {(phase === "running" || phase === "paused") && (
              <>
                <button className="btn-royal flex-1" onClick={finishSession}>
                  <Square size={15} /> Finish
                </button>
                <button className="btn-ghost flex-1" onClick={cancelSession}>
                  <XCircle size={15} /> Cancel
                </button>
              </>
            )}
          </div>

          {(phase === "running" || phase === "paused") && isRep && (
            <div className="mt-4">
              <label className="text-xs uppercase tracking-wider text-gray-500">
                Or enter reps manually (demo)
              </label>
              <input
                className="input-field mt-1.5"
                inputMode="numeric"
                placeholder="e.g. 25"
                value={manualInput}
                onChange={(e) =>
                  setManualInput(e.target.value.replace(/\D/g, ""))
                }
              />
            </div>
          )}
        </Card>

        {/* Guidance panel */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <SectionTitle>{ex.name}</SectionTitle>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {ex.targetMuscles.map((m) => (
                <span
                  key={m}
                  className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-gray-400"
                >
                  {m}
                </span>
              ))}
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Instructions
            </div>
            <ol className="mt-2 space-y-1.5 text-sm text-gray-300">
              {ex.instructions.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-lime">{i + 1}.</span> {s}
                </li>
              ))}
            </ol>
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-royal/30 bg-royal/5 p-3 text-xs text-royalbright">
              <Info size={14} className="mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold">Form guide</div>
                <ul className="mt-1 list-disc pl-4 text-royalbright/80">
                  {ex.formTips.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle>
              Reward rules <DemoTag>configurable</DemoTag>
            </SectionTitle>
            <div className="text-sm text-gray-400">
              <div>
                XP: <strong className="text-gray-100">{ex.xpPerUnit}</strong> /{" "}
                {isRep ? "rep" : "sec"}
              </div>
              <div className="mt-1">
                Strength:{" "}
                <strong className="text-lime">{ex.strengthPerUnit}</strong> /{" "}
                {isRep ? "rep" : "sec"}
              </div>
              <div className="mt-1">
                FM Coins:{" "}
                <strong className="text-royalbright">{ex.coinsPerUnit}</strong>{" "}
                / {isRep ? "rep" : "sec"}
              </div>
            </div>
            <p className="mt-3 text-[11px] text-gray-600">
              These are demo game values, not scientifically validated fitness
              measurements. Cancelled or zero-duration sessions award nothing.
              Feeds building category:{" "}
              <strong className="capitalize text-gray-400">
                {ex.buildingCategory}
              </strong>
              .
            </p>
            {state.profile && state.profile.kingdomId && (
              <div className="mt-3">
                <ProgressBar
                  pct={Math.min(100, (rewardPreview.q / 50) * 100)}
                  label={`Kingdom contribution preview · ${ex.buildingCategory}`}
                  tone="bg-royal"
                />
              </div>
            )}
          </Card>

          {summary && (
            <Card className="border-lime/40">
              <div className="flex items-center gap-2 text-lime">
                <CheckCircle2 size={20} />
                <span className="font-display text-lg font-bold">
                  Workout complete!
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center text-sm">
                <div className="rounded-lg bg-white/5 p-2.5">
                  <div className="font-bold text-gray-100">
                    {summary.quantity}
                  </div>
                  <div className="text-xs text-gray-500">
                    {isRep ? "reps" : "sec"}
                  </div>
                </div>
                <div className="rounded-lg bg-white/5 p-2.5">
                  <div className="font-bold text-lime">+{summary.xp}</div>
                  <div className="text-xs text-gray-500">XP</div>
                </div>
                <div className="rounded-lg bg-white/5 p-2.5">
                  <div className="font-bold text-royalbright">
                    +{summary.coins}
                  </div>
                  <div className="text-xs text-gray-500">FM Coins</div>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-gray-500">
                Recorded as <strong>demo data</strong> — recorded kind: "
                {summary.kind}". Real verification arrives with the backend.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
