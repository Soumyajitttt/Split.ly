import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";
import Card from "../../components/Card";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";

export default function GroupDetails() {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadGroup = async () => {
    try {
      const { data } = await api.get(`/groups/${id}`);
      setGroup(data.group);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadGroup();
  }, []);

  if (loading) return <Loader />;
  if (!group) return <EmptyState title="Group not found" />;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{group.name}</h2>
        <Link
          to={`/groups/${id}/add-expense`}
          className="bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          Add Expense
        </Link>
      </div>

      <h3 className="font-semibold mb-2">Expenses</h3>

      {group.expenses.length === 0 ? (
        <EmptyState title="No expenses yet" />
      ) : (
        <div className="flex flex-col gap-3">
          {group.expenses.map((exp) => (
            <Card key={exp._id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{exp.description}</p>
                  <p className="text-sm text-gray-500">₹{exp.amount}</p>
                </div>
                <Link
                  to={`/expenses/${exp._id}`}
                  className="text-green-600 font-medium"
                >
                  View
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}