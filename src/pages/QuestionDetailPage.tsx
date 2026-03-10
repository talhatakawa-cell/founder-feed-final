import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";

export default function QuestionDetailPage({ currentUser }: { currentUser: any }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [question, setQuestion] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [newAnswer, setNewAnswer] = useState("");
  const [editingAnswerId, setEditingAnswerId] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/questions/${id}`, {
        credentials: "include",
      });
      const data = await res.json();
      setQuestion(data.question);
      setAnswers(data.answers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // -------------------------
  // DELETE QUESTION
  // -------------------------
  const handleDeleteQuestion = async () => {
    if (!confirm("Delete this question?")) return;

    const res = await fetch(`/api/questions/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.ok) navigate("/qa");
  };

  // -------------------------
  // DELETE ANSWER
  // -------------------------
  const handleDeleteAnswer = async (answerId: number) => {
    if (!confirm("Delete this answer?")) return;

    const res = await fetch(`/api/answers/${answerId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.ok) {
      setAnswers(prev => prev.filter(a => a.id !== answerId));
    }
  };

  // -------------------------
  // EDIT ANSWER
  // -------------------------
  const handleEditAnswer = async (answerId: number) => {
    if (!editedContent.trim()) return;

    const res = await fetch(`/api/answers/${answerId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content: editedContent }),
    });

    if (res.ok) {
      setAnswers(prev =>
        prev.map(a =>
          a.id === answerId ? { ...a, content: editedContent } : a
        )
      );
      setEditingAnswerId(null);
      setEditedContent("");
    } else {
      const data = await res.json();
      alert(data.error || "Edit failed");
    }
  };

  // -------------------------
  // MARK BEST
  // -------------------------
  const handleMarkBest = async (answerId: number) => {
    const res = await fetch(`/api/answers/${answerId}/best`, {
      method: "PUT",
      credentials: "include",
    });

    if (res.ok) fetchData();
  };

  // -------------------------
  // POST ANSWER
  // -------------------------
  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnswer.trim()) return;

    const res = await fetch(`/api/questions/${id}/answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content: newAnswer }),
    });

    if (res.ok) {
      const data = await res.json();

      setAnswers(prev => [
        ...prev,
        {
          id: data.id,
          content: newAnswer,
          author_name: currentUser.name,
          user_id: currentUser.id,
          is_best: 0,
        },
      ]);

      setNewAnswer("");
    }
  };

  // -------------------------

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );

  if (!question)
    return <p className="text-center py-10">Question not found</p>;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-8">

      {/* BACK BUTTON */}
      <Link
        to="/qa"
        className="flex items-center gap-2 text-zinc-500 hover:text-emerald-500 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to all questions
      </Link>

      {/* QUESTION */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
        <h1 className="text-xl font-bold mb-3">{question.title}</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          {question.description}
        </p>
        <p className="text-xs text-zinc-400 mb-4">
          Asked by {question.author_name}
        </p>

        <div className="flex gap-4 text-xs">
          {currentUser?.id === question.user_id && (
            <button
              onClick={handleDeleteQuestion}
              className="text-zinc-400 hover:text-red-500"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* ANSWERS */}
      <div>
        <h2 className="text-lg font-bold mb-4">
          {answers.length} Answers
        </h2>

        <div className="space-y-4">
          {answers.map(a => (
            <div
              key={a.id}
              className={`border rounded-xl p-4 ${
                a.is_best
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              {/* EDIT MODE */}
              {editingAnswerId === a.id ? (
                <>
                  <textarea
                    value={editedContent}
                    onChange={e => setEditedContent(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 bg-zinc-50 dark:bg-zinc-800"
                  />
                  <div className="flex gap-3 mt-2 text-xs">
                    <button
                      onClick={() => handleEditAnswer(a.id)}
                      className="text-emerald-500 hover:text-emerald-400"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingAnswerId(null)}
                      className="text-zinc-400"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p>{a.content}</p>
                  <p className="text-xs text-zinc-400 mt-2">
                    — {a.author_name}
                  </p>

                  <div className="flex gap-4 text-xs mt-3">

                    {/* ANSWER OWNER */}
                    {currentUser?.id === a.user_id && (
                      <>
                        <button
                          onClick={() => {
                            setEditingAnswerId(a.id);
                            setEditedContent(a.content);
                          }}
                          className="text-zinc-400 hover:text-emerald-500"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDeleteAnswer(a.id)}
                          className="text-zinc-400 hover:text-red-500"
                        >
                          Delete
                        </button>
                      </>
                    )}

                    {/* QUESTION OWNER */}
                    {currentUser?.id === question.user_id &&
                      currentUser?.id !== a.user_id && (
                        <button
                          onClick={() => handleMarkBest(a.id)}
                          className="text-zinc-400 hover:text-emerald-500"
                        >
                          Mark as Best
                        </button>
                      )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ADD ANSWER */}
      <form
        onSubmit={handleAnswerSubmit}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4"
      >
        <h3 className="font-bold">Your Answer</h3>
        <textarea
          value={newAnswer}
          onChange={e => setNewAnswer(e.target.value)}
          className="w-full border rounded-xl px-4 py-2 min-h-[120px] bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-emerald-500"
          required
        />
        <button className="bg-emerald-500 hover:bg-emerald-400 px-6 py-2 rounded-xl font-bold text-zinc-950">
          Post Answer
        </button>
      </form>
    </div>
  );
}