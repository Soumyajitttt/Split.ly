import { useEffect, useState } from "react";
import { getAdminActivity } from "../../services/admin";
import Loader from "../../components/Loader";
import Card from "../../components/Card";

export default function AdminActivity() {
  const [logs, setLogs] = useState(null);

  useEffect(() => {
    const load = async () => {
      const data = await getAdminActivity();
      setLogs(data.logs);
    };
    load();
  }, []);

  if (!logs) return <Loader />;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Admin Activity Logs</h2>

      <div className="flex flex-col gap-3">
        {logs.map((log) => (
          <Card key={log._id}>
            <p>{log.message}</p>
            <p className="text-sm text-gray-500">
              {new Date(log.createdAt).toLocaleString()}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}