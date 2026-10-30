import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Coins, Flame, LogOut, Save, ShieldCheck, Trash2 } from "lucide-react";
import { useApp } from "../../features/store/StoreProvider";
import {
  Card,
  SectionTitle,
  DemoTag,
  ProgressBar,
} from "../../components/ui/Primitives";
import { RoleBadge, CrownLogo } from "../../components/ui/CrownLogo";
import { levelProgress } from "../../data/gameRules";

const AVATARS = ["w1", "w2", "w3", "w4", "w5", "w6"];
const AVATAR_TONES: Record<string, string> = {
  w1: "from-lime/60 to-lime/10",
  w2: "from-royal/60 to-royal/10",
  w3: "from-sky-500/60 to-sky-500/10",
  w4: "from-red-500/60 to-red-500/10",
  w5: "from-purple-500/60 to-purple-500/10",
  w6: "from-amber-500/60 to-amber-500/10",
};

export default function Profile() {
  const { state, store } = useApp();
  const navigate = useNavigate();
  const p = state.profile!;
  const lp = levelProgress(p.xp);
  const [name, setName] = useState(p.fullName);
  const [avatar, setAvatar] = useState(p.avatarSeed);
  const [saved, setSaved] = useState(false);
  const kingdom = p.kingdomId ? state.kingdoms[p.kingdomId] : null;

  const save = () => {
    store.updateProfile({
      fullName: name.trim() || p.fullName,
      avatarSeed: avatar,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-10 -top-14 h-52 w-52 rounded-full bg-royal/10 blur-3xl" />
        <div className="flex flex-wrap items-center gap-5">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${AVATAR_TONES[avatar] ?? AVATAR_TONES.w1} font-display text-2xl font-black text-obsidian`}
          >
            {p.fullName
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-gray-100">
                {p.fullName}
              </h1>
              <RoleBadge role={p.role} />
            </div>
            <p className="text-sm text-gray-500">{p.email}</p>
            <p className="mt-0.5 text-xs text-gray-600">
              {kingdom
                ? `${kingdom.name} · joined kingdom roster`
                : "Independent warrior"}{" "}
              · warrior since {new Date(p.joinedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="ml-auto grid grid-cols-2 gap-2.5 text-center text-xs sm:grid-cols-4">
            <div className="rounded-lg bg-white/5 p-2.5">
              <div className="text-lg font-bold text-lime">{lp.level}</div>
              <div className="text-gray-500">Level</div>
            </div>
            <div className="rounded-lg bg-white/5 p-2.5">
              <div className="text-lg font-bold text-gray-100">
                {p.strength.toLocaleString()}
              </div>
              <div className="text-gray-500">Strength</div>
            </div>
            <div className="rounded-lg bg-white/5 p-2.5">
              <div className="text-lg font-bold text-lime">
                {p.xp.toLocaleString()}
              </div>
              <div className="text-gray-500">XP</div>
            </div>
            <div className="rounded-lg bg-white/5 p-2.5">
              <div className="flex items-center justify-center gap-1 text-lg font-bold text-royalbright">
                <Coins size={14} /> {Math.round(p.coins)}
              </div>
              <div className="text-gray-500">FM</div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar
            pct={lp.pct}
            label={`XP to level ${Math.min(lp.level + 1, 8)} · ${lp.current}/${lp.needed}`}
          />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle
            right={
              saved ? (
                <span className="text-xs text-lime">Saved ✓</span>
              ) : undefined
            }
          >
            Edit profile <DemoTag />
          </SectionTitle>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
            Display name
          </label>
          <input
            className="input-field mt-1.5"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-gray-400">
            Avatar tone
          </label>
          <div className="mt-2 flex gap-2.5">
            {AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => setAvatar(a)}
                className={`h-10 w-10 rounded-xl bg-gradient-to-br ${AVATAR_TONES[a]} border-2 transition ${avatar === a ? "border-lime scale-110" : "border-transparent"}`}
                aria-label={`Avatar ${a}`}
              />
            ))}
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-gray-500">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-lime" />
            Only your display name and avatar tone are editable and exposed.
            Your email and demo credentials are never shown on any public
            profile view.
          </div>
          <button className="btn-primary mt-4 w-full" onClick={save}>
            <Save size={16} /> Save changes
          </button>
        </Card>

        <div className="space-y-6">
          <Card>
            <SectionTitle right={<DemoTag />}>Weekly consistency</SectionTitle>
            <div className="flex items-end gap-2" style={{ height: 90 }}>
              {p.weeklyConsistency.map((min, i) => {
                const max = Math.max(...p.weeklyConsistency, 1);
                return (
                  <div
                    key={i}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-lime/40 to-lime"
                      style={{ height: `${Math.max(4, (min / max) * 70)}px` }}
                    />
                    <span className="text-[10px] text-gray-600">
                      {["M", "T", "W", "T", "F", "S", "S"][i]}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 text-xs text-gray-500">
              {p.weeklyConsistency.reduce((a, b) => a + b, 0)} total minutes
              this week (simulated)
            </div>
          </Card>

          <Card>
            <SectionTitle right={<DemoTag />}>
              Recent FM transactions
            </SectionTitle>
            {state.transactions.length === 0 ? (
              <p className="text-sm text-gray-500">No transactions yet.</p>
            ) : (
              <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                {state.transactions.slice(0, 6).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm"
                  >
                    <span className="truncate text-gray-400">
                      {tx.description}
                    </span>
                    <span
                      className={
                        tx.amount >= 0
                          ? "font-semibold text-lime"
                          : "font-semibold text-red-400"
                      }
                    >
                      {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {p.contributions.length > 0 && (
        <Card>
          <SectionTitle>
            Kingdom contribution history <DemoTag />
          </SectionTitle>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {p.contributions.slice(0, 9).map((c) => (
              <div key={c.id} className="rounded-lg bg-white/5 p-3 text-sm">
                <div className="text-gray-300">
                  {c.buildingType}{" "}
                  <span className="text-royalbright">+{c.amount}</span>
                </div>
                <div className="text-xs text-gray-500">
                  via {c.exerciseId} ·{" "}
                  {new Date(c.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle>
          Account <DemoTag>frontend demo session</DemoTag>
        </SectionTitle>
        <div className="flex flex-wrap gap-3">
          <button
            className="btn-ghost flex items-center gap-2"
            onClick={() => {
              store.logout();
              navigate("/login");
            }}
          >
            <LogOut size={15} /> Sign out
          </button>
          <button
            className="btn-ghost flex items-center gap-2 text-red-300"
            onClick={() => {
              store.resetDemo();
              navigate("/login");
            }}
          >
            <Trash2 size={15} /> Reset demo data
          </button>
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-gray-600">
          <CrownLogo size={16} /> Signing out clears the local demo session and
          returns you to the login page.
        </p>
      </Card>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
        <Flame size={13} className="text-lime" /> "Let's Build Empire With
        Exercise."
      </div>
    </div>
  );
}
