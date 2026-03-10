import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "../types";

export default function NewStoryPage({ currentUser }: { currentUser: User | null }) {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Auto grow content textarea
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    const el = contentRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/stories", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",  // 👈 এটা যোগ করো
  body: JSON.stringify({
    title: title.trim(),
    content: content.trim(),
  }),
});

      if (res.ok) {
        navigate("/stories");
      } else {
        alert("Failed to publish story");
      }
    } catch (err) {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-3xl mx-auto py-16 px-6">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8">

        {/* TITLE */}
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add title"
          rows={2}
          maxLength={120}
          className="
            w-full
            text-3xl
            font-bold
            leading-tight
            bg-transparent
            outline-none
            resize-none
            break-words
            whitespace-pre-wrap
            mb-8
          "
        />

        {/* CONTENT */}
        <textarea
          ref={contentRef}
          value={content}
          onChange={handleContentChange}
          placeholder="Your story (max 1000 words)..."
          className="
            w-full
            bg-transparent
            outline-none
            text-lg
            leading-8
            resize-none
            overflow-hidden
            min-h-[200px]
          "
        />

        {/* FOOTER */}
        <div className="flex justify-between items-center mt-8">
          <p className="text-xs text-zinc-500">
            {content.trim().split(/\s+/).filter(Boolean).length} / 1000 words
          </p>

          <button
            onClick={handlePublish}
            disabled={loading || !title.trim() || !content.trim()}
            className="
              bg-emerald-500
              hover:bg-emerald-400
              disabled:opacity-50
              text-zinc-950
              font-bold
              px-6
              py-2
              rounded-md
              transition
            "
          >
            {loading ? "Publishing..." : "Publish"}
          </button>
        </div>

      </div>
    </div>
  );
}