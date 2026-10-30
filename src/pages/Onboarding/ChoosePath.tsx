import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Castle, ChevronRight, Footprints, Swords, Users } from "lucide-react";
import { useApp } from "../../features/store/StoreProvider";
import {
  demoDistance,
  mockKingdomService,
  type NearbyKingdom,
} from "../../services/mock/kingdomService";
import { CrownLogo, RoleBadge } from "../../components/ui/CrownLogo";
import { DemoTag } from "../../components/ui/Primitives";
import { useEffect } from "react";

export default function ChoosePath() {
  const { state, store } = useApp();
  const navigate = useNavigate();
  const [inspect, setInspect] = useState<NearbyKingdom | null>(null);
  const [confirmKingdom, setConfirmKingdom] = useState<NearbyKingdom | null>(
    null,
  );
  const [kingdoms, setKingdoms] = useState<NearbyKingdom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void mockKingdomService.discoverNearby().then((ks) => {
      setKingdoms(ks);
      setLoading(false);
    });
  }, []);

  if (!state.profile) return null;

  const goIndependent = () => {
    store.choosePath("independent");
    if (state.profile!.kingdomId) store.leaveKingdom();
    store.finishOnboarding();
    navigate("/dashboard");
  };

  const joinKingdom = (k: NearbyKingdom) => {
    store.choosePath("kingdom");
    store.joinKingdom(k.id);
    store.finishOnboarding();
    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <div className="animate-fade-up w-full max-w-4xl">
        <div className="mb-6 flex items-center gap-3">
          <CrownLogo size={44} />
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-100">
              Choose Your Path
            </h1>
            <p className="text-sm text-gray-500">
              Every empire begins with a decision.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Path A */}
          <div className="panel flex flex-col p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-royal/40 bg-royal/10 p-3">
                <Castle className="text-royalbright" size={24} />
              </div>
              <h2 className="font-display text-xl font-bold text-gray-100">
                Join a Kingdom
              </h2>
            </div>
            <p className="mt-3 text-sm text-gray-400">
              Train with a kingdom. Help its King and members build a stronger
              Samrajya.
            </p>
            {loading ? (
              <p className="mt-4 text-sm text-gray-500">
                Loading demo kingdoms…
              </p>
            ) : (
              <div
                className="mt-4 flex-1 space-y-2.5 overflow-y-auto"
                style={{ maxHeight: 320 }}
              >
                {kingdoms.map((k) => (
                  <button
                    key={k.id}
                    className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-graphite/70 p-3.5 text-left transition hover:border-royal/40 hover:bg-royal/5"
                    onClick={() => setInspect(k)}
                  >
                    <Castle size={18} className="shrink-0 text-royal" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-gray-200">
                        {k.name}
                      </div>
                      <div className="truncate text-xs text-gray-500">
                        {k.kingName} · {demoDistance(k).toFixed(1)} km (demo)
                      </div>
                    </div>
                    <Users size={14} className="text-gray-600" />
                    <span className="text-xs text-gray-500">
                      {k.members.length}
                    </span>
                    <ChevronRight size={16} className="text-gray-600" />
                  </button>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-gray-600">
              You begin as a Member — never as the King. Explicit confirmation
              required before joining.
            </p>
          </div>

          {/* Path B */}
          <div className="panel flex flex-col p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-lime/40 bg-lime/10 p-3">
                <Footprints className="text-lime" size={24} />
              </div>
              <h2 className="font-display text-xl font-bold text-gray-100">
                Train Independently
              </h2>
            </div>
            <p className="mt-3 text-sm text-gray-400">
              Build your warrior strength independently. Train, earn rewards,
              and discover your future kingdom.
            </p>
            <ul className="mt-4 flex-1 space-y-2.5 text-sm text-gray-400">
              <li className="flex items-center gap-2.5">
                <Swords size={16} className="text-lime" /> Access the full
                Workout Arena
              </li>
              <li className="flex items-center gap-2.5">
                <Footprints size={16} className="text-lime" /> Earn demo FM
                Coins and XP from simulated sessions
              </li>
              <li className="flex items-center gap-2.5">
                <Castle size={16} className="text-lime" /> Explore the world map
                freely
              </li>
              <li className="flex items-center gap-2.5">
                <Users size={16} className="text-lime" /> Join a kingdom
                whenever you're ready
              </li>
            </ul>
            <button className="btn-primary mt-6 w-full" onClick={goIndependent}>
              Begin Independent Training <ChevronRight size={17} />
            </button>
          </div>
        </div>

        {/* Kingdom inspection modal */}
        {inspect && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setInspect(null)}
          >
            <div
              className="panel w-full max-w-lg p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold text-royalbright">
                  {inspect.name}
                </h3>
                <DemoTag>demo kingdom</DemoTag>
              </div>
              <p className="mt-2 text-sm text-gray-400">
                {inspect.description}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
                <div className="rounded-lg bg-white/5 p-2.5">
                  <div className="text-lg font-bold text-gray-100">
                    {inspect.population.toLocaleString()}
                  </div>
                  <div className="text-[10px] uppercase text-gray-500">
                    Population
                  </div>
                </div>
                <div className="rounded-lg bg-white/5 p-2.5">
                  <div className="text-lg font-bold text-gray-100">
                    {inspect.strength.toLocaleString()}
                  </div>
                  <div className="text-[10px] uppercase text-gray-500">
                    Strength
                  </div>
                </div>
                <div className="rounded-lg bg-white/5 p-2.5">
                  <div className="text-lg font-bold text-gray-100">
                    {inspect.members.length}
                  </div>
                  <div className="text-[10px] uppercase text-gray-500">
                    Warriors
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Royal council
                </div>
                <div className="mt-2 space-y-2">
                  {inspect.members
                    .filter((m) => m.role !== "Member")
                    .map((m) => (
                      <div
                        key={m.userId}
                        className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
                      >
                        <span className="text-sm text-gray-200">{m.name}</span>
                        <RoleBadge role={m.role} />
                      </div>
                    ))}
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  className="btn-ghost flex-1"
                  onClick={() => setInspect(null)}
                >
                  Back
                </button>
                <button
                  className="btn-royal flex-1"
                  onClick={() => {
                    setConfirmKingdom(inspect);
                    setInspect(null);
                  }}
                >
                  Request to join
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Join confirmation */}
        {confirmKingdom && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setConfirmKingdom(null)}
          >
            <div
              className="panel w-full max-w-md p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Castle className="mx-auto text-royalbright" size={32} />
              <h3 className="mt-3 font-display text-lg font-bold text-gray-100">
                Serve {confirmKingdom.name}?
              </h3>
              <p className="mt-2 text-sm text-gray-400">
                You will enter as a{" "}
                <strong className="text-lime">Member</strong> under{" "}
                {confirmKingdom.kingName}. Your demo contributions will feed its
                buildings.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  className="btn-ghost flex-1"
                  onClick={() => setConfirmKingdom(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary flex-1"
                  onClick={() => joinKingdom(confirmKingdom)}
                >
                  I swear my strength
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
