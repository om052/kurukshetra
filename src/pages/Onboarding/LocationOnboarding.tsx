import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  LoaderCircle,
  MapPin,
  MapPinOff,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { useApp } from "../../features/store/StoreProvider";
import {
  mockKingdomService,
  demoDistance,
  type NearbyKingdom,
} from "../../services/mock/kingdomService";
import { CrownLogo } from "../../components/ui/CrownLogo";
import { DemoTag } from "../../components/ui/Primitives";
import type { OnboardingState } from "../../types";

export default function LocationOnboarding() {
  const { state, store } = useApp();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<
    "explain" | "locating" | "done" | "failed"
  >("explain");
  const [status, setStatus] =
    useState<OnboardingState["locationStatus"]>("unset");
  const [kingdoms, setKingdoms] = useState<NearbyKingdom[]>([]);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  const loadKingdoms = async (label: OnboardingState["locationStatus"]) => {
    const ks = await mockKingdomService.discoverNearby();
    setKingdoms(ks);
    store.setLocationStatus(
      label,
      ks.map((k) => k.id),
    );
    setPhase("done");
  };

  const requestLocation = () => {
    setPhase("locating");
    setErrorDetail(null);
    if (!("geolocation" in navigator) || !window.isSecureContext) {
      setStatus("unavailable");
      setErrorDetail(
        "Geolocation is unavailable in this browser context. Continuing with the simulated region.",
      );
      store.setLocationStatus("unavailable");
      void loadKingdoms("unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (_pos) => {
        // Approximate location only — coordinates are never displayed or logged.
        setStatus("granted");
        void loadKingdoms("granted");
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus("denied");
          setErrorDetail(
            "Permission denied. You can continue anyway — the empire has demo lands.",
          );
          store.setLocationStatus("denied");
          void loadKingdoms("denied");
        } else {
          setStatus("unavailable");
          setErrorDetail(
            err.code === err.TIMEOUT
              ? "Location request timed out."
              : "Location unavailable on this device.",
          );
          store.setLocationStatus("unavailable");
          void loadKingdoms("unavailable");
        }
      },
      { timeout: 10000, maximumAge: 600000 },
    );
  };

  const skip = () => {
    setStatus("skipped");
    void loadKingdoms("skipped");
  };

  if (!state.profile) return null;

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <div className="animate-fade-up w-full max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <CrownLogo size={44} />
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-100">
              Welcome, {state.profile.fullName.split(" ")[0]}
            </h1>
            <p className="text-sm text-gray-500">
              First, let's find where your journey begins.
            </p>
          </div>
        </div>

        {phase === "explain" && (
          <div className="panel p-8">
            <div className="flex items-start gap-4">
              <div className="rounded-xl border border-royal/40 bg-royal/10 p-3">
                <MapPin className="text-royalbright" size={26} />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-gray-100">
                  Why we need your location
                </h2>
                <p className="mt-2 text-sm text-gray-400">
                  "Discover nearby kingdoms, explore local territories, and
                  choose where your fitness journey begins." Your approximate
                  location may be used to discover nearby kingdoms.
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <ShieldAlert size={14} /> Coordinates are never displayed,
                  stored, or logged. With permission denied, the app still works
                  fully.
                </div>
                <p className="mt-3 text-xs text-gray-600">
                  No verified geographic kingdom data exists yet — any "nearby"
                  kingdoms shown are clearly labelled demo kingdoms around a
                  simulated region.
                </p>
              </div>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <button className="btn-primary" onClick={requestLocation}>
                <MapPin size={17} /> Allow location
              </button>
              <button className="btn-ghost" onClick={skip}>
                <MapPinOff size={17} /> Continue without location
              </button>
            </div>
          </div>
        )}

        {phase === "locating" && (
          <div className="panel flex flex-col items-center gap-4 p-12 text-center">
            <LoaderCircle className="animate-spin text-lime" size={36} />
            <p className="text-sm text-gray-400">Scanning the realm…</p>
          </div>
        )}

        {phase === "done" && (
          <div className="panel p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl font-bold text-gray-100">
                {status === "granted"
                  ? "Kingdoms discovered near you"
                  : "Demo kingdoms of the simulated region"}
              </h2>
              <DemoTag>
                {status === "granted"
                  ? "Labelled demo kingdoms (not verified nearby places)"
                  : "Location not used — simulated region"}
              </DemoTag>
            </div>
            {errorDetail && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <XCircle size={17} className="mt-0.5 shrink-0" /> {errorDetail}{" "}
                <button
                  className="ml-auto shrink-0 font-semibold text-lime hover:underline"
                  onClick={() => {
                    setPhase("explain");
                  }}
                >
                  Retry permission
                </button>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {kingdoms.map((k) => (
                <div
                  key={k.id}
                  className="rounded-xl border border-white/10 bg-graphite/70 p-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold text-royalbright">
                      {k.name}
                    </h3>
                    <DemoTag>
                      {status === "granted"
                        ? `${demoDistance(k).toFixed(1)} km`
                        : "demo region"}
                    </DemoTag>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Ruled by {k.kingName}
                  </div>
                  <p className="mt-2 text-sm text-gray-400">{k.description}</p>
                  <div className="mt-3 flex gap-4 text-xs text-gray-400">
                    <span>
                      <strong className="text-gray-200">
                        {k.population.toLocaleString()}
                      </strong>{" "}
                      population
                    </span>
                    <span>
                      <strong className="text-gray-200">
                        {k.strength.toLocaleString()}
                      </strong>{" "}
                      strength
                    </span>
                  </div>
                  <button
                    className="btn-ghost mt-4 w-full text-sm"
                    onClick={() => {
                      store.choosePath("kingdom");
                      store.joinKingdom(k.id);
                      store.finishOnboarding();
                      navigate("/dashboard");
                    }}
                  >
                    <CheckCircle2 size={16} /> Join as Member
                  </button>
                </div>
              ))}
            </div>
            <button
              className="btn-ghost mt-5 w-full"
              onClick={() => navigate("/onboarding/choose-path")}
            >
              Or view both paths →
            </button>
          </div>
        )}

        {phase === "failed" && (
          <div className="panel p-8 text-center">
            <p className="text-gray-300">
              Something went wrong discovering kingdoms.
            </p>
            <button className="btn-primary mt-4" onClick={requestLocation}>
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
