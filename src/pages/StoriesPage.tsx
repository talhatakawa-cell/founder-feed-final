import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Plus } from "lucide-react";
import { User } from "../types";


export default function StoriesPage({ currentUser }: { currentUser: User | null }) {
  const location = useLocation();
interface Story {
  id: number;
  title: string;
  content: string;
  author_name: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  user_id: number;
  author_avatar?: string;
}

const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchStories();
}, [location]);

  const fetchStories = async () => {
    try {
      const res = await fetch("/api/stories", {
        credentials: "include",
      });

      if (!res.ok) {
        setStories([]);
        return;
      }

      const data = await res.json();
      setStories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  // ❤️ Like Toggle
  const toggleLike = async (e: any, id: number) => {
    e.preventDefault();
    e.stopPropagation();

    const res = await fetch(`/api/stories/${id}/like`, {
      method: "POST",
      credentials: "include",
    });

    const data = await res.json();

    setStories((prev) =>
      prev.map((story) =>
        story.id === id
          ? {
              ...story,
              is_liked: data.liked,
              likes_count: data.liked
  ? story.likes_count + 1
  : Math.max(0, story.likes_count - 1),
            }
          : story
      )
    );
  };

  //  Report
  const reportStory = async (e: any, id: number) => {
    e.preventDefault();
    e.stopPropagation();

    await fetch(`/api/stories/${id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ reason: "Inappropriate content" }),
    });

    alert("Story reported");
  };

  // 🗑 Delete
  const deleteStory = async (e: any, id: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Delete this story?")) return;

    await fetch(`/api/stories/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    setStories((prev) => prev.filter((story) => story.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Success Stories</h1>

        {currentUser && (
          <Link
            to="/stories/new"
            className="flex items-center gap-2 bg-emerald-500 text-zinc-950 font-bold px-4 py-2 rounded-xl"
          >
            <Plus className="w-4 h-4" />
            Your Story
          </Link>
        )}
      </div>

      {loading ? (
        <p className="text-zinc-500">Loading stories...</p>
      ) : stories.length === 0 ? (
        <p className="text-zinc-500">No stories yet.</p>
      ) : (
        <div className="space-y-4">
          {stories.map((s) => (
            <Link
              key={s.id}
              to={`/stories/${s.id}`}
              className="block p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-500/40 transition"
            >
              <h2 className="font-bold text-lg mb-1 break-words">
                {s.title}
              </h2>

             <div className="flex items-center gap-3 mb-2">

  {/* PROFILE IMAGE */}
  <Link
    to={`/profile/${s.user_id}`}
    onClick={(e) => e.stopPropagation()}
    className="w-9 h-9 rounded-xl overflow-hidden border border-zinc-700"
  >
    {s.author_avatar ? (
      <img
        src={s.author_avatar}
        className="w-full h-full object-cover"
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-xs bg-zinc-700">
        {s.author_name?.charAt(0)}
      </div>
    )}
  </Link>

  {/* AUTHOR NAME */}
  <div className="text-xs text-zinc-500">
    <Link
      to={`/profile/${s.user_id}`}
      onClick={(e) => e.stopPropagation()}
      className="font-semibold hover:text-emerald-400"
    >
      {s.author_name}
    </Link>{" "}
    • {new Date(s.created_at).toLocaleDateString()}
  </div>

</div>

              <p className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-3 mb-4">
                {s.content}
              </p>

              {/* 🔥 ACTION BAR */}
              <div className="flex items-center gap-6 text-sm text-zinc-500">

                {/* ❤️ Like */}
                <button
                  onClick={(e) => toggleLike(e, s.id)}
                  className={`flex items-center gap-1 ${
                    s.is_liked ? "text-red-500" : "hover:text-red-400"
                  }`}
                >
                  ❤️ {s.likes_count || 0}
                </button>

                {/* 💬 Comments */}
                <span className="hover:text-emerald-400">
                  💬 {s.comments_count || 0}
                </span>

                {/*  Report */}
                <button
                  onClick={(e) => reportStory(e, s.id)}
                  className="hover:text-yellow-400"
                >
                   Report
                </button>

                {/*  Edit + 🗑 Delete (Only Author) */}
                {currentUser?.id === s.user_id && (
                  <>
                    <Link
                      to={`/stories/${s.id}/edit`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-blue-400"
                    >
                       Edit
                    </Link>

                    <button
                      onClick={(e) => deleteStory(e, s.id)}
                      className="hover:text-red-600"
                    >
                      🗑 Delete
                    </button>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}