import { useState } from "react";
import { registerUser } from "../../services/auth";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [err, setErr] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    try {
      const res = await registerUser(form);
      login(res.token);
      navigate("/dashboard");
    } catch (error) {
      setErr(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>

      {err && <div className="bg-red-100 text-red-700 p-2 mb-3">{err}</div>}

      <form className="space-y-4" onSubmit={submit}>
        <input
          name="name"
          placeholder="Full Name"
          className="w-full border p-2 rounded-lg"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          className="w-full border p-2 rounded-lg"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          className="w-full border p-2 rounded-lg"
          value={form.password}
          onChange={handleChange}
          required
        />

        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg"
        >
          Register
        </button>
      </form>

      <p className="text-center mt-3">
        Already have an account?{" "}
        <Link className="text-green-600 font-medium" to="/login">
          Login
        </Link>
      </p>
    </div>
  );
}