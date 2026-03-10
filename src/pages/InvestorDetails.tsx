import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function InvestorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/investor-requests/${id}`, { credentials: "include" })
      .then(res => res.json())
      .then(setData);
  }, [id]);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="container">

      <button onClick={() => navigate("/investors")}>
        ← Back
      </button>

      <h2>{data.startup_name}</h2>
      <p>{data.pitch}</p>

      <p><strong>Website:</strong> {data.website_url}</p>
      <p><strong>Users:</strong> {data.users_count}</p>
      <p><strong>Monthly Revenue:</strong> {data.monthly_revenue || "N/A"}</p>
      <p><strong>Raising:</strong> ${data.amount_raising}</p>

      <button onClick={() => navigate(`/profile/${data.user_id}`)}>
        View Founder Profile
      </button>
    </div>
  );
}