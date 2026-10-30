import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Castle, Map as MapIcon } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../../services/apiClient";
import { Card, SectionTitle, EmptyState } from "../../components/ui/Primitives";

export default function Dashboard() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<any>(null);
  const [mine, setMine] = useState<any>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true); setError(null);
      try {
        const token = await getToken();
        const [m, k] = await Promise.all([
          apiFetch("/auth/me", token),
          apiFetch("/kingdoms/mine", token),
        ]);
        if (active) { setMe(m); setMine(k); }
      } catch (e: any) {
        if (active) setError(e.message || "Failed");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [getToken]);

  if (loading) return <div className="p-6 text-gray-300">Loading dashboard…</div>;
  if (error) return <div className="p-6 text-red-300">{error} <button onClick={() => window.location.reload()} className="ml-2 underline">Retry</button></div>;

  const memberships = mine?.memberships || [];
  const kingdoms = mine?.kingdoms || [];

  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle>Dashboard</SectionTitle>
        <p className="text-sm text-gray-300">Signed in as: {me?.userId || "unknown"}</p>
        {memberships.length === 0 ? (
          <EmptyState title="No kingdoms yet" body="Create your first kingdom to begin." />
        ) : (
          <div className="mt-4 space-y-3">
            {memberships.map((m: any) => {
              const k = kingdoms.find((x: any) => String(x._id) === String(m.kingdomId));
              return (
                <div key={String(m._id)} className="rounded-lg bg-white/5 p-3">
                  <div className="font-bold text-gray-100">{k?.name || "Kingdom"}</div>
                  <div className="text-xs text-gray-400">Role: {m.role}</div>
                  {k && <Link to={`/kingdom/${k._id}`} className="btn-ghost mt-2 text-sm">Open 3D Kingdom</Link>}
                </div>
              );
            })}
          </div>
        )}
        <button className="btn-royal mt-4" onClick={() => navigate("/map")}>Open Map</button>
      </Card>
    </div>
  );
}