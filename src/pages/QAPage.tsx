import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, MessageCircle } from "lucide-react";

interface Question {
  id: number;
  title: string;
  description: string;
  author_name: string;
  answers_count: number;
  created_at: string;
}

export default function QAPage({ currentUser }: { currentUser: any }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = async () => {
    try {
      const res = await fetch("/api/questions");
      if (!res.ok) throw new Error("Failed to fetch questions");
      const data = await res.json();
      setQuestions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Founder Q&A</h1>

        <Link
          to="/qa/new"
          className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-5 py-2 rounded-xl text-sm font-bold transition-colors"
        >
          + Ask Question
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-500 text-center py-10">{error}</p>
      )}

      {/* Empty State */}
      {!loading && questions.length === 0 && (
        <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
          <MessageCircle className="w-10 h-10 mx-auto mb-4 text-zinc-400" />
          <p className="text-zinc-500">No questions yet.</p>
          <p className="text-sm text-zinc-400">
            Be the first founder to ask something 🚀
          </p>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-6">
        {questions.map((q) => (
          <Link
            key={q.id}
            to={`/qa/${q.id}`}
            className="block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:border-emerald-500 transition-colors"
          >
            <div className="flex justify-between items-start gap-4">
              
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-2 text-zinc-900 dark:text-zinc-100">
                  {q.title}
                </h2>

                <p className="text-sm text-zinc-500 line-clamp-2">
                  {q.description}
                </p>

                <p className="text-xs text-zinc-400 mt-3">
                  Asked by {q.author_name} •{" "}
                  {new Date(q.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex flex-col items-center bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-xl text-sm">
                <span className="font-bold text-lg">
                  {q.answers_count}
                </span>
                <span className="text-xs text-zinc-500">
                  Answers
                </span>
              </div>

            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}