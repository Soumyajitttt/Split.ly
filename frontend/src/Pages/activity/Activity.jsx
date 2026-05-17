import { useEffect, useState } from "react";
import api from "../../services/api";
import Card from "../../components/Card";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";

export default function Activity() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get("/activity");
      setLogs(data.logs);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(load, []);

  if (loading) return <Loader />;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>

      {logs.length === 0 && <EmptyState title="No recent activity" />}

      <div className="flex flex-col gap-3">
        {logs.map((l) => (
          <Card key={l._id}>{l.message}</Card>
        ))}
      </div>
    </div>
  );
}