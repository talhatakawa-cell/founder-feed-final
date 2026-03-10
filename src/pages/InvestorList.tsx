import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

type InvestorRequest = {
  id: number;
  user_id: number;
  startup_name: string;
  website_url?: string | null;
  launched_date: string;
  monthly_revenue?: string | null;
  users_count: number;
  amount_raising: number;
  pitch: string;
  created_at: string;

  founder_name?: string;
  founder_avatar?: string | null;
};

type Me = {
  id: number;
  name: string;
  email: string;
};

export default function InvestorList() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState<InvestorRequest[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    startup_name: "",
    website_url: "",
    launched_date: "",
    monthly_revenue: "",
    users_count: "",
    amount_raising: "",
    pitch: "",
  });

  const loadMe = async () => {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (res.ok) setMe(await res.json());
  };

  const loadRequests = async () => {
    const res = await fetch("/api/investor-requests", {
      credentials: "include",
    });
    if (res.ok) setRequests(await res.json());
  };

  useEffect(() => {
    loadMe();
    loadRequests();
  }, []);

  const resetForm = () => {
    setAgreed(false);
    setForm({
      startup_name: "",
      website_url: "",
      launched_date: "",
      monthly_revenue: "",
      users_count: "",
      amount_raising: "",
      pitch: "",
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!agreed) {
      alert("You must agree to the terms before submitting.");
      return;
    }

    if (!form.startup_name.trim() || !form.launched_date.trim() || !form.pitch.trim()) {
      alert("Startup Name, Launch Date, and Pitch are required.");
      return;
    }

    const payload = {
      ...form,
      users_count: Number(form.users_count),
      amount_raising: Number(form.amount_raising),
      monthly_revenue: form.monthly_revenue ? String(form.monthly_revenue) : null,
      website_url: form.website_url ? String(form.website_url) : null,
    };

    if (Number.isNaN(payload.users_count) || Number.isNaN(payload.amount_raising)) {
      alert("Users and Funding must be numbers.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/investor-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Something went wrong");
        return;
      }

      setOpen(false);
      resetForm();
      await loadRequests();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Do you want to delete this request?")) return;

    const res = await fetch(`/api/investor-requests/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data?.error || "Delete failed");
      return;
    }

    await loadRequests();
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-10">
        <h2 className="text-2xl font-semibold">Startups Raising Funds</h2>

        <button
          onClick={() => setOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-5 py-2 rounded-xl transition"
        >
          Get Investor
        </button>
      </div>

      {/* LIST */}
      <div className="space-y-6">
        {requests.length === 0 ? (
          <div className="text-zinc-500 text-center py-16">
            No startups submitted yet.
          </div>
        ) : (
          requests.map((r) => (
            <div
              key={r.id}
              className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6"
            >
              <div className="flex items-start justify-between gap-4">

                {/* LEFT */}
                <div className="flex items-start gap-4">

                  {/* FOUNDER AVATAR */}
                  <Link
  to={`/profile/${r.user_id}`}
  className="flex-shrink-0 w-10 h-10 rounded-xl overflow-hidden border border-zinc-700"
>
                  
                    {r.founder_avatar ? (
                      <img
                        src={r.founder_avatar}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs bg-zinc-700">
                        {r.founder_name?.charAt(0)}
                      </div>
                    )}
                  </Link>

                  <div>
                    <h3
                      onClick={() => navigate(`/profile/${r.user_id}`)}
                      className="text-lg font-semibold cursor-pointer hover:text-emerald-400 transition"
                    >
                      {r.startup_name}
                    </h3>

                    <p className="text-xs text-zinc-500 mb-2">
                      by{" "}
                      <Link
                        to={`/profile/${r.user_id}`}
                        className="hover:text-emerald-400"
                      >
                        {r.founder_name}
                      </Link>
                    </p>

                    <p className="text-zinc-400 mt-2">{r.pitch}</p>

                    <div className="mt-4 text-sm text-zinc-400 space-y-1">
                      <div>
                        <span className="text-zinc-500">Users:</span>{" "}
                        {r.users_count}
                      </div>

                      <div>
                        <span className="text-zinc-500">Monthly Revenue:</span>{" "}
                        {r.monthly_revenue || "—"}
                      </div>

                      <div>
                        <span className="text-zinc-500">Launch Date:</span>{" "}
                        {r.launched_date}
                      </div>

                      {r.website_url && (
                        <div>
                          <span className="text-zinc-500">Website:</span>{" "}
                          <a
                            className="text-emerald-400 hover:underline"
                            href={r.website_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {r.website_url}
                          </a>
                        </div>
                      )}
                    </div>

                    <p className="mt-4 text-emerald-400 font-medium">
                      Raising: ${r.amount_raising}
                    </p>
                  </div>
                </div>

                {/* DELETE BUTTON */}
                {me && r.user_id === me.id && (
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="text-sm px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
          <div className="w-full max-w-4xl bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-800">
              <h2 className="text-xl font-semibold">Raise Investment</h2>

              <button
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
                className="text-zinc-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {/* FORM */}
            <div className="max-h-[75vh] overflow-y-auto px-8 py-6">
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* LEFT */}
                  <div className="space-y-5">
                    <input
                      placeholder="Startup Name"
                      className="input"
                      value={form.startup_name}
                      onChange={(e) =>
                        setForm({ ...form, startup_name: e.target.value })
                      }
                    />

                    <input
                      placeholder="Website URL"
                      className="input"
                      value={form.website_url}
                      onChange={(e) =>
                        setForm({ ...form, website_url: e.target.value })
                      }
                    />

                    <input
                      type="date"
                      className="input"
                      value={form.launched_date}
                      onChange={(e) =>
                        setForm({ ...form, launched_date: e.target.value })
                      }
                    />
                  </div>

                  {/* RIGHT */}
                  <div className="space-y-5">
                    <input
                      type="number"
                      placeholder="Users"
                      className="input"
                      value={form.users_count}
                      onChange={(e) =>
                        setForm({ ...form, users_count: e.target.value })
                      }
                    />

                    <input
                      type="number"
                      placeholder="Monthly Revenue"
                      className="input"
                      value={form.monthly_revenue}
                      onChange={(e) =>
                        setForm({ ...form, monthly_revenue: e.target.value })
                      }
                    />

                    <input
                      type="number"
                      placeholder="Funding Needed"
                      className="input"
                      value={form.amount_raising}
                      onChange={(e) =>
                        setForm({ ...form, amount_raising: e.target.value })
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <textarea
                      rows={6}
                      className="input"
                      placeholder="Startup pitch..."
                      value={form.pitch}
                      onChange={(e) =>
                        setForm({ ...form, pitch: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm text-zinc-400">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={() => setAgreed(!agreed)}
                    className="accent-emerald-500"
                  />

                  <p>
                    I acknowledge that investment decisions are at my own risk
                    and the platform is not responsible for disputes.
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-zinc-800 rounded-xl"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-emerald-500 text-black font-semibold rounded-xl"
                  >
                    {loading ? "Submitting..." : "Submit Request"}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}