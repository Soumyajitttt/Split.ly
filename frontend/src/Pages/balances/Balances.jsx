import { useEffect, useState } from "react";
import api from "../../services/api";
import Card from "../../components/Card";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";

export default function Balances() {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await api.get("/balances");
    setBalances(data.balances);
    setLoading(false);
  };

  useEffect(load, []);

  if (loading) return <Loader />;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Your Balances</h2>

      {balances.length === 0 ? (
        <EmptyState title="No balances found" />
      ) : (
        <div className="flex flex-col gap-3">
          {balances.map((b) => (
            <Card key={b._id}>
              <p>
                {b.type === "owe" ? "You owe " : "You are owed "}
                <strong>₹{b.amount}</strong> to/from {b.user.name}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}