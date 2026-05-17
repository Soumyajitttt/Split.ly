import { useEffect, useState } from "react";
import api from "../../services/api";
import Card from "../../components/Card";
import Loader from "../../components/Loader";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = async () => {
    try {
      const { data } = await api.get("/balances/summary");
      setSummary(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSummary();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card>
        <h3 className="font-semibold text-lg">You Owe</h3>
        <p className="text-2xl mt-2 text-red-600">₹{summary.totalYouOwe}</p>
      </Card>

      <Card>
        <h3 className="font-semibold text-lg">You Are Owed</h3>
        <p className="text-2xl mt-2 text-green-600">₹{summary.totalYouAreOwed}</p>
      </Card>

      <Card>
        <h3 className="font-semibold text-lg">Net Balance</h3>
        <p className="text-2xl mt-2">{summary.netBalance >= 0 ? "₹" + summary.netBalance : "-₹" + Math.abs(summary.netBalance)}</p>
      </Card>
    </div>
  );
}