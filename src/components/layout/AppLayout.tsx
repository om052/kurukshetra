import { useEffect, useState, type ReactNode } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Dumbbell,
  Map,
  Castle,
  ScrollText,
  UserRound,
  Coins,
  Bell,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../../services/apiClient";
import { useApp } from "../../features/store/StoreProvider";
import { levelProgress } from "../../data/gameRules";
import { CrownLogo } from "../ui/CrownLogo";

export default function AppLayout() {
  const { state, store } = useApp();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [myKingdomPath, setMyKingdomPath] = useState("/map");
  const p = state.profile;
  if (!p) return null;
  const lp = levelProgress(p.xp);
  const unread = state.notifications.filter((n) => !n.read).length;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await getToken();
        const res = await apiFetch("/kingdoms/mine", token ?? undefined);
        const kingdoms = Array.isArray(res?.kingdoms) ? res.kingdoms : [];
        const id = kingdoms[0]?._id || res?.kingdom?._id;
        if (active && id) setMyKingdomPath(`/kingdom/${encodeURIComponent(id)}`);
        else if (active) setMyKingdomPath("/map");
      } catch {
        if (active) setMyKingdomPath("/map");
      }
    })();
    return () => { active = false; };
  }, [getToken]);

  // Close mobile menu on route change
  useEffect(() => setMenuOpen(false), [navigate]);

  const NAV = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/workout", label: "Workout Arena", icon: Dumbbell },
    { to: "/map", label: "World Map", icon: Map },
    { to: myKingdomPath, label: "My Kingdom", icon: Castle, match: "/kingdom" },
    { to: "/sabha", label: "Sabha", icon: ScrollText },
    { to: "/profile", label: "Profile", icon: UserRound },
  ];
  const kingdomLabel = p.kingdomId
    ? (state.kingdoms[p.kingdomId]?.name ?? "Kingdom")
    : "Independent";

  const navLinks = NAV.map(({ to, label, icon: Icon, match }) => (
    <NavLink
      key={to}
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
          isActive || (match && location.pathname.startsWith(match))
            ? "bg-lime/15 text-lime"
            : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
        }`
      }
    >
      <Icon size={18} /> {label}
    </NavLink>
  ));

  const topbar = (
    <header className="flex items-center justify-between gap-4 border-b border-white/10 bg-graphite/70 px-4 py-3 backdrop-blur md:px-6">
      <button
        className="text-gray-300 md:hidden"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      <div className="hidden items-center gap-3 md:flex">
        <CrownLogo size={30} />
        <div>
          <div className="gold-text font-display text-sm font-bold tracking-wide">
            FITNESS MESSER
          </div>
          <div className="text-[10px] uppercase tracking-widest text-gray-500">
            {kingdomLabel} · frontend demo
          </div>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-end gap-3 md:gap-5">
        <div className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-300">
          <span className="text-gray-500">LV </span>
          <span className="font-bold text-lime">{lp.level}</span>
          <span className="ml-2 hidden text-gray-500 sm:inline">
            {lp.pct}% to next
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-royal/40 bg-royal/10 px-3 py-1.5">
          <Coins size={15} className="text-royal" />
          <span className="text-sm font-bold text-royalbright">
            {Math.round(p.coins)}
          </span>
          <span className="hidden text-[10px] uppercase tracking-wide text-royal/70 sm:inline">
            FM
          </span>
        </div>
        <div className="relative">
          <button
            className="relative rounded-lg p-2 text-gray-300 hover:bg-white/5"
            onClick={() => {
              setNotifOpen((v) => !v);
              if (!notifOpen) store.markNotificationsRead();
            }}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="panel absolute right-0 top-12 z-40 w-80 max-w-[85vw] p-2 shadow-2xl">
              <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Notifications (demo)
              </div>
              {state.notifications.slice(0, 6).map((n) => (
                <div key={n.id} className="rounded-lg p-2.5 hover:bg-white/5">
                  <div
                    className={`text-sm font-medium ${n.tone === "warning" ? "text-red-300" : n.tone === "success" ? "text-lime" : "text-gray-200"}`}
                  >
                    {n.title}
                  </div>
                  <div className="text-xs text-gray-400">{n.body}</div>
                </div>
              ))}
              {state.notifications.length === 0 && (
                <div className="p-3 text-sm text-gray-500">Nothing yet.</div>
              )}
            </div>
          )}
        </div>
        <button
          className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5"
          onClick={() => {
            store.logout();
            navigate("/login");
          }}
        >
          <LogOut size={15} />{" "}
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );

  const sidebar = (
    <nav className="flex flex-col gap-1 p-3">
      <div className="mb-4 flex items-center gap-3 px-2 pt-2">
        <CrownLogo size={38} />
        <div>
          <div className="gold-text font-display text-base font-bold">
            FITNESS MESSER
          </div>
          <div className="text-[10px] uppercase tracking-widest text-gray-500">
            Build empire with exercise
          </div>
        </div>
      </div>
      {navLinks}
      <div className="mt-auto rounded-xl border border-white/10 bg-graphite p-3">
        <div className="text-xs font-semibold text-gray-300">{p.fullName}</div>
        <div className="mt-1 text-[11px] text-gray-500">
          {p.mode === "kingdom"
            ? `${p.role} · ${state.kingdoms[p.kingdomId!]?.name ?? ""}`
            : "Independent warrior"}
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-lime"
            style={{ width: `${lp.pct}%` }}
          />
        </div>
        <div className="mt-1 text-[10px] text-gray-500">
          {lp.current}/{lp.needed} XP to level {lp.level + 1}
        </div>
      </div>
    </nav>
  );

  return (
    <div className="flex h-full">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-graphite/60 md:flex">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-white/10 bg-graphite">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {topbar}
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
          <div className="animate-fade-up mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
