import { useEffect, useState } from "react";
import api from "../../services/api";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import { Link } from "react-router-dom";
import Loader from "../../components/Loader";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadGroups = async () => {
    try {
      const { data } = await api.get("/groups");
      setGroups(data.groups);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadGroups();
  }, []);

  if (loading) return <Loader />;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Your Groups</h2>

      {groups.length === 0 && <EmptyState title="No groups yet" subtitle="Create or join one to get started." />}

      <div className="grid md:grid-cols-2 gap-4">
        {groups.map((g) => (
          <Link key={g._id} to={`/groups/${g._id}`}>
            <Card>
              <h3 className="font-semibold text-lg">{g.name}</h3>
              <p className="text-gray-600 text-sm mt-1">{g.members.length} members</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}