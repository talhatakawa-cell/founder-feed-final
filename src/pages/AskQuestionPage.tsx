import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function AskQuestionPage({ currentUser }: { currentUser: any }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // ✅ VERY IMPORTANT
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        navigate(`/qa/${data.id}`);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create question");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Ask a Question</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4"
      >
        <div>
          <label className="text-sm font-semibold block mb-2">
            Question Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What problem are you facing?"
            className="w-full border rounded-xl px-4 py-2 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
        </div>

        <div>
          <label className="text-sm font-semibold block mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain your problem in detail..."
            className="w-full border rounded-xl px-4 py-2 min-h-[150px] bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-emerald-500 hover:bg-emerald-400 px-6 py-2 rounded-xl font-bold text-zinc-950 flex items-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Posting..." : "Post Question"}
        </button>
      </form>
    </div>
  );
}