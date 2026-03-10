import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { User } from "../types";

type PartnerRequest = {
  id: number;
  user_id: number;
  startup_name: string;
  website_url?: string | null;
  monthly_revenue?: string | null;
  needed_role: string;
  description: string;
  founder_name?: string;
  founder_avatar?: string | null;
};

export default function FindPartnerPage({ currentUser }: { currentUser: User }) {
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [agreed, setAgreed] = useState(false);

  const [form, setForm] = useState({
    startup_name: "",
    website_url: "",
    monthly_revenue: "",
    needed_role: "",
    description: "",
  });

  // ✅ SAFE LOAD
  const loadRequests = async () => {
    try {
      const res = await fetch("/api/partner-requests");
      if (!res.ok) {
        setRequests([]);
        return;
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        setRequests(data);
      } else {
        setRequests([]);
      }
    } catch {
      setRequests([]);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // ✅ SUBMIT
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!agreed) {
      alert("You must accept the terms before submitting.");
      return;
    }

    if (
      !form.startup_name.trim() ||
      !form.needed_role.trim() ||
      !form.description.trim()
    ) {
      alert("All required fields must be filled");
      return;
    }

    if (form.description.length > 600) {
      alert("Description must be under 600 characters");
      return;
    }

    await fetch("/api/partner-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setOpen(false);
    setAgreed(false);
    setForm({
      startup_name: "",
      website_url: "",
      monthly_revenue: "",
      needed_role: "",
      description: "",
    });

    loadRequests();
  };

  // ✅ DELETE (OWNER ONLY)
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this request?")) return;

    await fetch(`/api/partner-requests/${id}`, {
      method: "DELETE",
    });

    loadRequests();
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-2xl font-semibold">Find Partner</h1>

        <button
          onClick={() => setOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-5 py-2 rounded-xl transition"
        >
          Find Partner
        </button>
      </div>

      {/* LIST */}
      <div className="space-y-6">
        {requests.length === 0 ? (
          <div className="text-zinc-500 text-center py-16">
            No partner requests yet.
          </div>
        ) : (
          requests.map((r) => (
            <div
              key={r.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex gap-4"
            >
              {/* PROFILE IMAGE */}
              <Link to={`/profile/${r.user_id}`}>
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-800 flex items-center justify-center border border-zinc-700">
                  {r.founder_avatar ? (
                    <img
                      src={r.founder_avatar}
                      alt="Founder"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-zinc-400 text-sm">
                      {r.founder_name?.charAt(0) || "U"}
                    </span>
                  )}
                </div>
              </Link>

              <div className="flex-1">
                {/* STARTUP NAME → PROFILE */}
                <Link
                  to={`/profile/${r.user_id}`}
                  className="text-lg font-semibold text-emerald-400 hover:underline"
                >
                  {r.startup_name}
                </Link>

                <p className="text-zinc-400 mt-2">{r.description}</p>

                <div className="mt-4 text-sm text-zinc-400 space-y-1">
                  <div>Revenue: {r.monthly_revenue || "—"}</div>
                  <div>Looking for: {r.needed_role}</div>
                  {r.website_url && (
                    <div>
                      Website:{" "}
                      <a
                        href={r.website_url}
                        target="_blank"
                        className="text-emerald-400 hover:underline"
                      >
                        {r.website_url}
                      </a>
                    </div>
                  )}
                </div>

                {/* OWNER DELETE */}
                {r.user_id === currentUser.id && (
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="mt-4 text-sm px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition"
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
              <h2 className="text-xl font-semibold">Create Partner Request</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="px-8 py-6 max-h-[75vh] overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs uppercase text-zinc-500 mb-2">
                        Monthly Revenue
                      </label>
                      <input
                        type="number"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3"
                        value={form.monthly_revenue}
                        onChange={(e) =>
                          setForm({ ...form, monthly_revenue: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase text-zinc-500 mb-2">
                        Needed Role
                      </label>
                      <input
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3"
                        value={form.needed_role}
                        onChange={(e) =>
                          setForm({ ...form, needed_role: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs uppercase text-zinc-500 mb-2">
                        Startup Name
                      </label>
                      <input
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3"
                        value={form.startup_name}
                        onChange={(e) =>
                          setForm({ ...form, startup_name: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase text-zinc-500 mb-2">
                        Website URL (optional)
                      </label>
                      <input
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3"
                        value={form.website_url}
                        onChange={(e) =>
                          setForm({ ...form, website_url: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase text-zinc-500 mb-2">
                      Description (max 600 characters)
                    </label>
                    <textarea
                      rows={6}
                      maxLength={600}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3"
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                    />
                    <div className="text-xs text-zinc-500 mt-2 text-right">
                      {form.description.length} / 600
                    </div>
                  </div>

                </div>

                {/* ✅ POLISHED RISK AGREEMENT */}
                <div className="flex items-start gap-3 text-sm text-zinc-400">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={() => setAgreed(!agreed)}
                    className="mt-1 accent-emerald-500"
                  />
                  <p>
                    I understand that any partnership or collaboration formed through this platform
                    is undertaken at my own discretion and risk. The platform shall not be held
                    responsible for any disputes, misunderstandings, financial losses, or future
                    conflicts arising from such engagements.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!agreed}
                    className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition disabled:opacity-50"
                  >
                    Submit Request
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