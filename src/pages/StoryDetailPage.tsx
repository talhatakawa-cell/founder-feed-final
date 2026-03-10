import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

export default function StoryDetailPage({ currentUser }: any) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [story, setStory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // 🔹 Fetch Story
  useEffect(() => {
    const fetchStory = async () => {
      try {
        const res = await fetch(`/api/stories/${id}`, {
          credentials: "include",
        });

        if (!res.ok) {
          setStory(null);
          return;
        }

        const data = await res.json();
        setStory(data);
        setEditTitle(data.title);
        setEditContent(data.content);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
    fetchComments();
  }, [id]);

  // 🔹 Fetch Comments
  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/stories/${id}/comments`, {
        credentials: "include",
      });
      const data = await res.json();
      setComments(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ❤️ Like
  const handleLike = async () => {
    const res = await fetch(`/api/stories/${id}/like`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    setLiked(data.liked);
  };

  // 💬 Add Comment
  const handleComment = async () => {
    if (!newComment.trim()) return;

    await fetch(`/api/stories/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content: newComment }),
    });

    setNewComment("");
    fetchComments();
  };

  //  Report
  const handleReport = async () => {
    await fetch(`/api/stories/${id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ reason: "Inappropriate content" }),
    });

    alert("Story reported");
  };

  //  Save Edit
  const handleSaveEdit = async () => {
    await fetch(`/api/stories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title: editTitle, content: editContent }),
    });

    setEditing(false);
    setStory({ ...story, title: editTitle, content: editContent });
  };

  // 🗑 Delete
  const handleDelete = async () => {
    if (!confirm("Delete this story?")) return;

    await fetch(`/api/stories/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    navigate("/stories");
  };

  if (loading) return <p className="p-10">Loading...</p>;
  if (!story) return <p className="p-10">Story not found.</p>;

  return (
    <div className="max-w-3xl mx-auto py-16 px-6">
      <Link to="/stories" className="text-emerald-500 mb-6 inline-block">
        ← Back to stories
      </Link>

      {editing ? (
        <>
          <input
            className="w-full p-3 mb-4 rounded bg-zinc-800"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />

          <textarea
            className="w-full p-3 mb-4 rounded bg-zinc-800"
            rows={8}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />

          <button
            onClick={handleSaveEdit}
            className="bg-emerald-500 px-4 py-2 rounded mr-3"
          >
            Save
          </button>

          <button
            onClick={() => setEditing(false)}
            className="bg-zinc-600 px-4 py-2 rounded"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-4">{story.title}</h1>

          <p className="text-sm text-zinc-500 mb-8">
            by {story.author_name} •{" "}
            {new Date(story.created_at).toLocaleDateString()}
          </p>

          <div className="text-lg leading-8 whitespace-pre-wrap mb-10">
            {story.content}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-6 mb-10 text-lg">
            <button onClick={handleLike} className="text-pink-500">
              {liked ? "❤️ Loved" : "🤍 Love"}
            </button>

            <button className="text-blue-400">
              💬 {comments.length}
            </button>

            <button onClick={handleReport} className="text-yellow-500">
               Report
            </button>

            {currentUser?.id === story.user_id && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="text-green-400"
                >
                   Edit
                </button>

                <button
                  onClick={handleDelete}
                  className="text-red-500"
                >
                  🗑 Delete
                </button>
              </>
            )}
          </div>

          {/* Comments Section */}
          <div className="mt-6">
            <h3 className="text-xl mb-4">Comments</h3>

            <div className="space-y-3 mb-4">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded bg-zinc-800 text-sm"
                >
                  <strong>{c.author_name}</strong>
                  <p>{c.content}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                className="flex-1 p-2 rounded bg-zinc-800"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button
                onClick={handleComment}
                className="bg-emerald-500 px-4 rounded"
              >
                Post
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}