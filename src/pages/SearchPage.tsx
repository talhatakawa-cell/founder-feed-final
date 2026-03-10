import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PostCard from "../components/PostCard";
import CommentSection from "../components/CommentSection";

type User = {
  id: number;
  name: string;
  startup_name?: string;
};

type SearchResults = {
  users: any[];
  posts: any[];
  stories: any[];
};

export default function SearchPage({
  currentUser,
}: {
  currentUser: User | null;
}) {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").trim();

  const [results, setResults] = useState<SearchResults>({
    users: [],
    posts: [],
    stories: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [activeComments, setActiveComments] = useState<number | null>(null);

  // =============================
  // 🔥 Handlers (Feed-like logic)
  // =============================

  const handleLike = async (id: number) => {
    try {
      const res = await fetch(`/api/posts/${id}/like`, {
        method: "POST",
      });

      if (res.ok) {
        setResults((prev) => ({
          ...prev,
          posts: prev.posts.map((p) =>
            p.id === id
              ? {
                  ...p,
                  is_liked: p.is_liked ? 0 : 1,
                  likes_count: p.is_liked
                    ? p.likes_count - 1
                    : p.likes_count + 1,
                }
              : p
          ),
        }));
      }
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setResults((prev) => ({
          ...prev,
          posts: prev.posts.filter((p) => p.id !== id),
        }));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleEdit = async (id: number, content: string) => {
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        setResults((prev) => ({
          ...prev,
          posts: prev.posts.map((p) =>
            p.id === id ? { ...p, content } : p
          ),
        }));
      }
    } catch (err) {
      console.error("Edit error:", err);
    }
  };

  const handleReport = async (id: number) => {
    const reason = prompt("Why are you reporting this post?");
    if (!reason) return;

    try {
      await fetch(`/api/posts/${id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      alert("Reported successfully.");
    } catch (err) {
      console.error("Report error:", err);
    }
  };

  const handleCoBuild = (authorId: number) => {
    setResults((prev) => ({
      ...prev,
      posts: prev.posts.map((p) =>
        p.user_id === authorId
          ? { ...p, is_co_building: p.is_co_building ? 0 : 1 }
          : p
      ),
    }));
  };

  // =============================
  // 🔍 Search Fetch
  // =============================

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!query) {
        setResults({ users: [], posts: [], stories: [] });
        return;
      }

      setLoading(true);
      setError("");

      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`
        );

        const contentType = res.headers.get("content-type") || "";
        const isJson = contentType.includes("application/json");

        if (!res.ok) {
          const bodyText = isJson
            ? JSON.stringify(await res.json())
            : await res.text();
          throw new Error(
            `Search failed: ${res.status} ${bodyText.slice(0, 200)}`
          );
        }

        if (!isJson) {
          const text = await res.text();
          throw new Error(
            `Expected JSON but got: ${contentType}. ${text.slice(0, 200)}`
          );
        }

        const data = await res.json();

        const safe: SearchResults = {
          users: Array.isArray(data?.users) ? data.users : [],
          posts: Array.isArray(data?.posts) ? data.posts : [],
          stories: Array.isArray(data?.stories) ? data.stories : [],
        };

        if (!cancelled) setResults(safe);
      } catch (err: any) {
        console.error("SEARCH ERROR:", err);
        if (!cancelled) setError(err?.message || "Search failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [query]);

  // =============================
  // 🖥️ UI
  // =============================

  return (
    <div className="min-h-screen flex justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Results for "{query || "—"}"
        </h1>

        {loading && (
          <p className="text-zinc-500 text-sm text-center">
            Searching...
          </p>
        )}

        {error && (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-10">

            {results.posts.length > 0 && (
              <div className="space-y-6">
                {results.posts.map((post) => (
                  <div key={post.id} className="space-y-2">
                    <PostCard
                      post={post}
                      currentUser={currentUser}
                      onLike={handleLike}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                      onReport={handleReport}
                      onCommentClick={(id) =>
                        setActiveComments(
                          activeComments === id ? null : id
                        )
                      }
                      onCoBuild={handleCoBuild}
                    />

                    {activeComments === post.id && (
                      <CommentSection
                        postId={post.id}
                        currentUser={currentUser}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {results.posts.length === 0 && (
              <p className="text-zinc-500 text-center">
                No results found.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}