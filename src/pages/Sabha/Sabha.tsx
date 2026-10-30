import { useMemo, useState } from "react";
import {
  Castle,
  Crown,
  Filter,
  Megaphone,
  ScrollText,
  Swords,
  Users,
} from "lucide-react";
import { useApp } from "../../features/store/StoreProvider";
import { Card, SectionTitle, DemoTag } from "../../components/ui/Primitives";
import { RoleBadge } from "../../components/ui/CrownLogo";
import { getExercise } from "../../data/exercises";
import { RULES } from "../../data/gameRules";

const ACTIVITY_TABS = [
  { id: "all", label: "All" },
  { id: "workout", label: "Workouts" },
  { id: "construction", label: "Construction" },
  { id: "membership", label: "Membership" },
  { id: "governance", label: "Governance" },
  { id: "challenge", label: "Challenges" },
] as const;

const ROLE_DUTIES: { role: string; duties: string[]; tone: string }[] = [
  {
    role: "King",
    tone: "border-royal/40",
    duties: [
      "Leads the kingdom",
      "Manages kingdom priorities",
      "Can hire workers using available kingdom funds",
      "Reviews important kingdom decisions",
    ],
  },
  {
    role: "Mantri",
    tone: "border-sky-400/40",
    duties: [
      "Supports administration",
      "Helps manage member requests and visitor communication",
      "Assists with kingdom coordination",
    ],
  },
  {
    role: "Senapati",
    tone: "border-red-400/40",
    duties: [
      "Oversees military readiness and warrior challenges",
      "Can initiate leadership challenges per demo battle rules",
    ],
  },
  {
    role: "Member",
    tone: "border-lime/40",
    duties: [
      "Trains their warrior",
      "Contributes to kingdom development",
      "Participates in permitted kingdom activities",
    ],
  },
];

export default function Sabha() {
  const { state, store } = useApp();
  const p = state.profile!;
  const kingdom = p.kingdomId ? state.kingdoms[p.kingdomId] : null;
  const [tab, setTab] = useState<(typeof ACTIVITY_TABS)[number]["id"]>("all");
  const [openAnnouncement, setOpenAnnouncement] = useState<string | null>(null);
  const [openChallenge, setOpenChallenge] = useState<string | null>(null);
  const [openMember, setOpenMember] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmResolve, setConfirmResolve] = useState<string | null>(null);

  const canAnnounce = !!p.role && p.role !== "Member";

  const announcements = useMemo(
    () =>
      state.announcements.filter((a) => !kingdom || a.kingdomId === kingdom.id),
    [state.announcements, kingdom],
  );
  const challenges = useMemo(
    () =>
      state.challenges.filter((c) => !kingdom || c.kingdomId === kingdom.id),
    [state.challenges, kingdom],
  );
  const activities = useMemo(
    () =>
      (kingdom
        ? state.activities.filter((a) => a.kingdomId === kingdom.id)
        : state.activities
      ).filter((a) => tab === "all" || a.category === tab),
    [state.activities, kingdom, tab],
  );
  const members = kingdom?.members ?? [];
  const memberContributions: Map<string, number> = useMemo(() => {
    if (!kingdom) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const c of p.contributions)
      if (c.kingdomId === kingdom.id)
        map.set(c.userName, (map.get(c.userName) ?? 0) + c.amount);
    return map;
  }, [p.contributions, kingdom]);

  if (!kingdom) {
    return (
      <Card className="text-center">
        <Castle size={34} className="mx-auto text-gray-500" />
        <h1 className="mt-3 font-display text-xl font-bold">
          No kingdom, no Sabha
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
          You are an independent warrior. The Sabha governs kingdoms — join one
          from the World Map to attend its assembly.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-100">
            Sabha of {kingdom.name.replace(" Kingdom", "")}
          </h1>
          <p className="text-sm text-gray-500">
            Royal assembly, activity and governance.{" "}
            <DemoTag>Demo events only</DemoTag>
          </p>
        </div>
        {canAnnounce && (
          <button
            className="btn-royal text-sm"
            onClick={() => setComposing((v) => !v)}
          >
            <Megaphone size={16} /> {composing ? "Close" : "New announcement"}
          </button>
        )}
      </div>

      {composing && (
        <Card>
          <SectionTitle>
            Draft announcement <DemoTag>as {p.role}</DemoTag>
          </SectionTitle>
          <input
            className="input-field"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="input-field mt-3 min-h-24"
            placeholder="Address the kingdom…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <button
            className="btn-primary mt-3"
            onClick={() => {
              if (!title.trim() || !body.trim())
                return setNotice("Title and body are required.");
              store.createAnnouncement(kingdom.id, title.trim(), body.trim());
              setTitle("");
              setBody("");
              setComposing(false);
              setNotice("Announcement posted to the kingdom (demo).");
            }}
          >
            Post announcement
          </button>
        </Card>
      )}

      {notice && (
        <div
          className="rounded-lg border border-lime/40 bg-lime/10 px-4 py-3 text-sm text-lime"
          onClick={() => setNotice(null)}
        >
          {notice} (dismiss)
        </div>
      )}

      {/* A. Royal Council */}
      <Card>
        <SectionTitle
          right={
            <span className="text-xs text-gray-500">
              Your role: <RoleBadge role={p.role} />
            </span>
          }
        >
          Royal Council
        </SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ROLE_DUTIES.map(({ role, duties, tone }) => {
            const holders = members.filter((m) => m.role === role);
            return (
              <div
                key={role}
                className={`rounded-xl border ${tone} bg-white/[0.03] p-4`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-display font-bold text-gray-100">
                    {role === "King" && (
                      <Crown size={15} className="text-royalbright" />
                    )}
                    {role === "Senapati" && (
                      <Swords size={15} className="text-red-300" />
                    )}
                    {role === "Mantri" && (
                      <ScrollText size={15} className="text-sky-300" />
                    )}
                    {role === "Member" && (
                      <Users size={15} className="text-lime" />
                    )}
                    {role}
                  </div>
                  <span className="text-xs text-gray-500">
                    {holders.length || "—"}
                  </span>
                </div>
                <div className="mt-1.5 text-xs text-gray-500">
                  {holders.map((h) => h.name).join(", ") || "Position open"}
                </div>
                <ul className="mt-3 space-y-1 text-xs text-gray-400">
                  {duties.map((d, i) => (
                    <li key={i}>· {d}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <div className="mt-4 grid-cols-2 gap-2.5 text-center text-xs sm:grid-cols-4">
          <div className="rounded-lg bg-white/5 p-2.5">
            <div className="text-base font-bold text-gray-100">
              {kingdom.population.toLocaleString()}
            </div>
            <div className="text-gray-500">Population</div>
          </div>
          <div className="rounded-lg bg-white/5 p-2.5">
            <div className="text-base font-bold text-lime">
              {kingdom.strength.toLocaleString()}
            </div>
            <div className="text-gray-500">Strength</div>
          </div>
          <div className="rounded-lg bg-white/5 p-2.5">
            <div className="text-base font-bold text-royalbright">
              {kingdom.treasury.toLocaleString()}
            </div>
            <div className="text-gray-500">Treasury</div>
          </div>
          <div className="rounded-lg bg-white/5 p-2.5">
            <div className="text-base font-bold text-gray-100">
              {members.length}
            </div>
            <div className="text-gray-500">Council roster</div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* B. Activity log */}
        <Card>
          <SectionTitle right={<Filter size={14} className="text-gray-600" />}>
            Kingdom activity log
          </SectionTitle>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {ACTIVITY_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-full border px-3 py-1 text-xs transition ${tab === t.id ? "border-lime/60 bg-lime/15 text-lime" : "border-white/10 text-gray-400 hover:bg-white/5"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="max-h-80 space-y-2.5 overflow-y-auto pr-1">
            {activities.map((a) => (
              <div key={a.id} className="rounded-lg bg-white/5 p-3">
                <div className="text-sm text-gray-300">
                  <strong className="text-gray-100">{a.actorName}</strong>{" "}
                  {a.action}
                </div>
                {a.outcome && (
                  <div className="text-xs text-lime/80">{a.outcome}</div>
                )}
                <div className="text-[11px] text-gray-600">
                  {new Date(a.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <p className="text-sm text-gray-500">
                No events in this category yet.
              </p>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          {/* D. Announcements */}
          <Card>
            <SectionTitle>Announcements</SectionTitle>
            <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
              {announcements.map((a) => (
                <div key={a.id}>
                  <button
                    className="w-full rounded-lg bg-white/5 p-3 text-left hover:bg-white/10"
                    onClick={() =>
                      setOpenAnnouncement(
                        openAnnouncement === a.id ? null : a.id,
                      )
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-200">
                        {a.title}
                      </span>
                      <RoleBadge role={a.authorRole} />
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {a.authorName} · {new Date(a.timestamp).toLocaleString()}
                    </div>
                  </button>
                  {openAnnouncement === a.id && (
                    <p className="mt-1.5 rounded-lg border border-white/10 bg-graphite p-3 text-sm text-gray-400">
                      {a.body}
                    </p>
                  )}
                </div>
              ))}
              {announcements.length === 0 && (
                <p className="text-sm text-gray-500">No announcements.</p>
              )}
            </div>
          </Card>

          {/* C. Contributions */}
          <Card>
            <SectionTitle>
              Contributions <DemoTag />
            </SectionTitle>
            {memberContributions.size === 0 ? (
              <p className="text-sm text-gray-500">
                No contributions recorded in this demo session yet. Complete
                workouts to feed the buildings.
              </p>
            ) : (
              <div className="space-y-2">
                {[...memberContributions.entries()].map(([name, amt]) => (
                  <div
                    key={name}
                    className="flex justify-between rounded-lg bg-white/5 px-3 py-2 text-sm"
                  >
                    <span className="text-gray-300">{name}</span>
                    <span className="text-royalbright">
                      +{amt} build progress
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* E/F. Challenges */}
      <Card>
        <SectionTitle right={<DemoTag />}>Challenges & fairness</SectionTitle>
        <div className="mb-4 rounded-lg border border-royal/30 bg-royal/5 p-3 text-xs text-royalbright">
          Fair-play rules (demo): agreed exercise · agreed time limit · results
          are never fabricated as verified measurements · leadership changes
          only via resolved challenge · <strong>one King per kingdom</strong>
          {RULES.kingCannotRejectSenapatiChallenge
            ? " · a King cannot reject a permitted Senapati challenge"
            : ""}
          .
        </div>
        <div className="space-y-2.5">
          {challenges.map((c) => (
            <div
              key={c.id}
              className="rounded-lg border border-white/10 bg-graphite/70 p-3.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm">
                  <strong className="text-gray-100">{c.challengerName}</strong>{" "}
                  vs <strong className="text-gray-100">{c.defenderName}</strong>
                  <span className="ml-2 text-xs text-gray-500">
                    {getExercise(c.exerciseId).name} · {c.timeLimitMin} min
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase ${c.status === "resolved" ? "border-gray-500/50 text-gray-400" : c.status === "active" ? "border-lime/60 text-lime" : "border-royal/50 text-royalbright"}`}
                  >
                    {c.status}
                  </span>
                  <button
                    className="text-xs text-lime hover:underline"
                    onClick={() =>
                      setOpenChallenge(openChallenge === c.id ? null : c.id)
                    }
                  >
                    details
                  </button>
                </div>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {c.type === "leadership"
                  ? "Leadership challenge"
                  : "Training duel"}
                {c.result ? ` · ${c.result}` : ""}
              </div>
              {openChallenge === c.id && (
                <div className="mt-2 rounded-lg bg-black/30 p-3 text-xs text-gray-400">
                  <p>{c.rules}</p>
                  {c.status !== "resolved" &&
                    (p.role === "King" || p.role === "Senapati") && (
                      <button
                        className="btn-ghost mt-3 text-xs"
                        onClick={() => setConfirmResolve(c.id)}
                      >
                        Resolve challenge (demo outcome)
                      </button>
                    )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Member roster modal */}
      <Card>
        <SectionTitle>Member roster</SectionTitle>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => (
            <button
              key={m.userId}
              className="rounded-lg bg-white/5 p-3 text-left hover:bg-white/10"
              onClick={() =>
                setOpenMember(openMember === m.userId ? null : m.userId)
              }
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-200">{m.name}</span>
                <RoleBadge role={m.role} />
              </div>
              <div className="text-xs text-gray-500">
                Lv {m.level} · strength {m.strength.toLocaleString()}
              </div>
              {openMember === m.userId && (
                <div className="mt-2 border-t border-white/10 pt-2 text-xs text-gray-400">
                  Joined {new Date(m.joinedAt).toLocaleDateString()}
                  {memberContributions.get(m.name)
                    ? ` · contributed ${memberContributions.get(m.name)} build progress (this session)`
                    : ""}
                </div>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Consequential confirmation */}
      {confirmResolve && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setConfirmResolve(null)}
        >
          <div
            className="panel w-full max-w-sm p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Swords className="mx-auto text-red-300" size={30} />
            <h3 className="mt-2 font-display text-lg font-bold">
              Resolve this challenge?
            </h3>
            <p className="mt-2 text-sm text-gray-400">
              This records a demo outcome in the kingdom log. The crown remains
              with one King.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                className="btn-ghost flex-1"
                onClick={() => setConfirmResolve(null)}
              >
                Cancel
              </button>
              <button
                className="btn-primary flex-1"
                onClick={() => {
                  const c = state.challenges.find(
                    (x) => x.id === confirmResolve,
                  );
                  store.resolveChallenge(
                    confirmResolve,
                    `${c?.defenderName ?? "Defender"} retains position (demo result, unverified)`,
                  );
                  setConfirmResolve(null);
                  setNotice(
                    "Challenge resolved and recorded in the activity log.",
                  );
                }}
              >
                Confirm resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
