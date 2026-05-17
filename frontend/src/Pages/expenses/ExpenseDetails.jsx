import { useEffect, useState } from "react";
import api from "../../services/api";
import { useParams } from "react-router-dom";
import Card from "../../components/Card";
import Loader from "../../components/Loader";

export default function ExpenseDetails() {
  const { id } = useParams();
  const [exp, setExp] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get(`/expenses/${id}`);
      setExp(data.expense);
    } catch (e) {
      console.log(e);
    }
    setLoading(false);
  };

  useEffect(load, []);

  if (loading) return <Loader />;
  if (!exp) return <>Not found</>;

  return (
    <Card>
      <h2 className="text-xl font-bold">{exp.description}</h2>
      <p className="text-lg mt-2">₹{exp.amount}</p>
      <p className="text-sm text-gray-500 mt-4">Paid by: {exp.paidBy?.name}</p>
    </Card>
  );
}