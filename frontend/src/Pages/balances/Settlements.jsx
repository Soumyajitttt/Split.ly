import { useEffect, useState } from "react";
import api from "../../services/api";
import Card from "../../components/Card";
import Loader from "../../components/Loader";

export default function Settlements() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await api.get("/settlements");
    setList(data.settlements);
    setLoading(false);
  };

  useEffect(load, []);

  if (loading) return <Loader />;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Settlements</h2>

      <div className="flex flex-col gap-3">
        {list.map((s) => (
          <Card key={s._id}>
            <p>
              {s.from.name} paid {s.to.name} — ₹{s.amount}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}