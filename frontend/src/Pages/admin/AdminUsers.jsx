import { useEffect, useState } from "react";
import { getAllUsers } from "../../services/admin";
import Loader from "../../components/Loader";
import Card from "../../components/Card";

export default function AdminUsers() {
  const [users, setUsers] = useState(null);

  useEffect(() => {
    const load = async () => {
      const data = await getAllUsers();
      setUsers(data.users);
    };
    load();
  }, []);

  if (!users) return <Loader />;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">All Users</h2>

      <Card>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b">
                <td className="py-2">{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}