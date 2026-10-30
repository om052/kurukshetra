import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Castle, Coins, Hammer, RotateCcw, Users } from "lucide-react";
import { useApp } from "../../features/store/StoreProvider";
import { Card, SectionTitle, DemoTag, ProgressBar } from "../../components/ui/Primitives";
import { RoleBadge } from "../../components/ui/CrownLogo";
import { apiFetch } from "../../services/apiClient";
import KingdomScene from "./KingdomScene";

export default function Kingdom3D() {
  const { kingdomId } = useParams();
  const { state, store } = useApp();
  const navigate = useNavigate();
  const [fetchedKingdom, setFetchedKingdom] = useState<any>(null);
  const localKingdom = kingdomId ? state.kingdoms[kingdomId] : null;
  const kingdom = fetchedKingdom ? {
    id: String(fetchedKingdom._id),
    name: fetchedKingdom.name,
    kingName: fetchedKingdom.kingClerkUserId,
    territorySize: 0,
    population: 0,
buildings: [] as any[],
    description: fetchedKingdom.description || "",
    createdAt: fetchedKingdom.createdAt,
  } : null;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [webglFailed, setWebglFailed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<"upgrade" | "hire" | null>(null);

const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!kingdomId) { setLoading(false); return; }
    setLoading(true);
    apiFetch(`/kingdoms/${kingdomId}`)
      .then((d) => setFetchedKingdom(d.kingdom))
      .catch(() => setFetchedKingdom(null))
      .finally(() => setLoading(false));
  }, [kingdomId]);

if (loading) return <Card className="text-center"><p className="text-sm text-gray-400">Loading kingdom…</p></Card>;
  if (!kingdom) {
    return (
      <Card className="text-center">
        <Castle size={32} className="mx-auto text-royal" />
        <h1 className="mt-3 font-display text-xl font-bold">Kingdom not found</h1>
        <p className="mt-1 text-sm text-gray-500">That territory isn't on the map.</p>
        <Link to="/map" className="btn-primary mt-4">Back to the map</Link>
      </Card>
    );
  }

  const p = state.profile!;
  const isMember = p.kingdomId === kingdom.id;
  const selected = kingdom.buildings.find((b) => b.id === selectedId) ?? null;

  const runUpgrade = () => {
    if (!selected) return;
    const res = store.upgradeBuilding(kingdom.id, selected.id);
    setMessage(res.message);
    setConfirming(null);
    if (res.ok) setResetSignal((s) => s + 1);
  };

  const runHire = () => {
    const res = store.hireWorker(kingdom.id);
    setMessage(res.message);
    setConfirming(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="gold-text font-display text-2xl font-bold">{kingdom.name}</h1>
          <p className="text-sm text-gray-500">Ruled by {kingdom.kingName} · {isMember ? "your kingdom" : "visiting warrior"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost text-sm" onClick={() => setResetSignal((s) => s + 1)}><RotateCcw size={15} /> Reset camera</button>
          <button className="btn-ghost text-sm" onClick={() => navigate("/map")}>Back to map</button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="relative min-h-[420px] lg:col-span-2 lg:min-h-[560px]" style={{ height: "70vh" }}>
          {webglFailed ? (
            <Card className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <Castle size={34} className="text-royal" />
              <h2 className="font-display text-lg font-bold text-gray-200">3D unavailable</h2>
              <p className="max-w-sm text-sm text-gray-500">
                Your browser couldn't initialise WebGL. The kingdom's stats remain fully functional in the panel beside you.
              </p>
            </Card>
          ) : (
            <ErrorBoundaryFallback onFail={() => setWebglFailed(true)}>
              <div className="h-full overflow-hidden rounded-xl border border-white/10">
                <KingdomScene kingdom={kingdom as any} selectedBuildingId={selectedId} onSelectBuilding={setSelectedId} resetSignal={resetSignal} />
              </div>
            </ErrorBoundaryFallback>
          )}
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-black/70 px-3 py-1.5 text-[11px] text-gray-400">
            drag to orbit · scroll to zoom · right-drag to pan · click buildings
          </div>
        </div>

        <div className="space-y-5">
          <Card>
            <SectionTitle right={<DemoTag />}>Kingdom overview</SectionTitle>
            <div className="grid grid-cols-2 gap-2.5 text-center text-xs">
              <div className="rounded-lg bg-white/5 p-2.5 col-span-2 text-gray-400">Detailed statistics are not available for this kingdom.</div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
              <span className="text-gray-200">{kingdom.kingName}</span>
              <RoleBadge role="King" />
            </div>
            {isMember && (
              <button className="btn-royal mt-4 w-full text-sm" onClick={() => navigate("/sabha")}>
                Enter the Sabha
              </button>
            )}
          </Card>

          <Card>
            <SectionTitle>Buildings <DemoTag>exercise-powered construction</DemoTag></SectionTitle>
            <div className="space-y-3">
              {kingdom.buildings.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedId(b.id)}
                  className={`w-full rounded-lg border p-3 text-left transition ${selectedId === b.id ? "border-lime/60 bg-lime/10" : "border-white/10 hover:bg-white/5"}`}
                >
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-gray-200">{b.type}</span>
                    <span className="text-royalbright">Lv {b.level}</span>
                  </div>
                  <div className="mt-2"><ProgressBar pct={(b.progress / b.progressRequired) * 100} tone="bg-royal" label={`${b.progress}/${b.progressRequired} progress · ${b.category}`} /></div>
                </button>
              ))}
            </div>
          </Card>

          {selected && (
            <Card>
              <SectionTitle right={<DemoTag />}>{selected.type}</SectionTitle>
              <p className="text-sm text-gray-400">{selected.description}</p>
              <div className="mt-3 text-xs text-gray-500">Category: <span className="capitalize text-gray-300">{selected.category}</span> — grows from exercises like push-ups (military), squats (defense), walking (infrastructure).</div>
              {isMember ? (
                <div className="mt-4 space-y-2.5">
                  <button className="btn-royal w-full text-sm" onClick={() => setConfirming("upgrade")} disabled={selected.progress < selected.progressRequired}>
                    <Hammer size={15} /> {selected.progress >= selected.progressRequired ? `Fund upgrade to Lv ${selected.level + 1}` : `Needs ${selected.progressRequired - selected.progress} more exercise progress`}
                  </button>
                  {p.role === "King" && (
                    <button className="btn-ghost w-full text-sm" onClick={() => setConfirming("hire")}><Users size={15} /> Hire worker (250 FM)</button>
                  )}
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-gray-500">
                  You are visiting as an independent warrior. Join this kingdom to contribute your exercise progress to its buildings.
                </div>
              )}
            </Card>
          )}

          {message && (
            <div className="rounded-lg border border-royal/40 bg-royal/10 px-4 py-3 text-sm text-royalbright" onClick={() => setMessage(null)}>
              {message} <span className="float-right text-gray-500">(dismiss)</span>
            </div>
          )}
        </div>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setConfirming(null)}>
          <div className="panel w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold text-gray-100">
              {confirming === "upgrade" ? "Confirm construction" : "Confirm hire"}
            </h3>
            <p className="mt-2 text-sm text-gray-400">
              {confirming === "upgrade"
                ? `Spend kingdom treasury funds to raise ${selected?.type} to level ${(selected?.level ?? 0) + 1}?`
                : "Spend 250 FM from the treasury to recruit one worker (+1 population)?"}
            </p>
            <div className="mt-5 flex gap-3">
              <button className="btn-ghost flex-1" onClick={() => setConfirming(null)}>Cancel</button>
              <button className="btn-primary flex-1" onClick={confirming === "upgrade" ? runUpgrade : runHire}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Minimal error boundary for WebGL scene failures. */
import { Component, type ReactNode } from "react";

class ErrorBoundaryFallback extends Component<{ onFail: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFail(); }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}
