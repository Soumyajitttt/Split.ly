import { useEffect, useState } from "react";
import api from "../../services/api";
import Card from "../../components/Card";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import { Link } from "react-router-dom";

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get("/expenses");
      setExpenses(data.expenses);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  useEffect(load, []);

  if (loading) return <Loader />;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">All Expenses</h2>

      {expenses.length === 0 && <EmptyState title="No expenses found" />}

      <div className="flex flex-col gap-3">
        {expenses.map((e) => (
          <Link key={e._id} to={`/expenses/${e._id}`}>
            <Card>
              <div className="flex justify-between">
                <span className="font-semibold">{e.description}</span>
                <span>₹{e.amount}</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}