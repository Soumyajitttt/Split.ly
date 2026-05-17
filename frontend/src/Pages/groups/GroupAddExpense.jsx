import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import Input from "../../components/Input";
import Button from "../../components/Button";

export default function GroupAddExpense() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    description: "",
    amount: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    await api.post(`/expenses/group/${id}`, form);
    navigate(`/groups/${id}`);
  };

  return (
    <div className="max-w-md">
      <h2 className="text-xl font-bold mb-4">New Group Expense</h2>

      <form className="space-y-4" onSubmit={submit}>
        <Input
          label="Description"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Lunch, Uber, groceries"
        />

        <Input
          label="Amount"
          name="amount"
          type="number"
          value={form.amount}
          onChange={handleChange}
        />

        <Button type="submit" className="w-full">
          Add Expense
        </Button>
      </form>
    </div>
  );
}