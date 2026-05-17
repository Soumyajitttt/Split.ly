import { useEffect, useState } from "react";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";
import Loader from "../../components/Loader";
import Card from "../../components/Card";

export default function Profile() {
  const { user } = useAuth();
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get("/users/me");
      setDetails(data.user);
    };
    load();
  }, []);

  if (!details) return <Loader />;

  return (
    <Card className="max-w-md">
      <h2 className="text-xl font-bold mb-3">Profile</h2>

      <p className="mb-2">
        <strong>Name:</strong> {details.name}
      </p>
      <p className="mb-2">
        <strong>Email:</strong> {details.email}
      </p>
    </Card>
  );
}