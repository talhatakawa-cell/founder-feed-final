import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateInvestor() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    startup_name: "",
    website_url: "",
    launched_date: "",
    monthly_revenue: "",
    users_count: "",
    amount_raising: "",
    pitch: "",
    agree: false,
  });

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!form.agree) {
      alert("You must agree before submitting.");
      return;
    }

    const res = await fetch("/api/investor-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });

    if (res.ok) {
      navigate("/investors");
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  return (
    <div className="container">
      <h2>Raise Investment</h2>

      <form onSubmit={handleSubmit} className="investor-form">

        <div className="grid">
          <input name="startup_name" placeholder="Startup Name" onChange={handleChange} required />
          <input name="website_url" placeholder="Website URL" onChange={handleChange} required />
          <input name="launched_date" type="date" onChange={handleChange} required />

          <input name="monthly_revenue" placeholder="Monthly Revenue (optional)" onChange={handleChange} />
          <input name="users_count" type="number" placeholder="Users" onChange={handleChange} required />
          <input name="amount_raising" type="number" placeholder="Amount Raising ($)" onChange={handleChange} required />
        </div>

        <textarea
          name="pitch"
          maxLength={60}
          placeholder="Short pitch (max 60 chars)"
          onChange={handleChange}
          required
        />

        <label className="agree-box">
          <input type="checkbox" name="agree" onChange={handleChange} />
          I understand that all investment decisions are made at my own risk...
        </label>

        <button type="submit">Submit</button>
      </form>
    </div>
  );
}