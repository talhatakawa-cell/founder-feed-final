import { useState } from 'react';
import { Heart, MessageSquare, Trash2, Flag, Pencil, X, Check, Hammer } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Post, User } from '../types';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

interface PostCardProps {
  post: Post;
  currentUser: User | null;
  onLike: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number, content: string) => Promise<void>;
  onReport: (id: number) => void;
  onCommentClick: (id: number) => void;
  onCoBuild: (authorId: number) => void;
}

export default function PostCard({
  post,
  currentUser,
  onLike,
  onDelete,
  onEdit,
  onReport,
  onCommentClick,
  onCoBuild,
}: PostCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [isCoBuilding, setIsCoBuilding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isSaving, setIsSaving] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    await onLike(post.id);
    setIsLiking(false);
  };

  const handleCoBuild = async () => {
    if (!currentUser || isCoBuilding) return;

    setIsCoBuilding(true);
    try {
      const res = await fetch(`/api/users/${post.user_id}/co-build`, {
        method: 'POST',
      });

      if (res.ok) {
        onCoBuild(post.user_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCoBuilding(false);
    }
  };

  const handleSave = async () => {
    if (!editContent.trim() || editContent === post.content) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    await onEdit(post.id, editContent.trim());
    setIsSaving(false);
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors group shadow-sm dark:shadow-none"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3">
          <Link
            to={`/profile/${post.user_id}`}
            className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 overflow-hidden hover:opacity-80 transition-opacity"
          >
            {post.author_avatar && !imgError ? (
              <img
                src={post.author_avatar}
                alt={post.author_name}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-sm font-bold text-emerald-500">
                {post.author_name?.[0]}
              </span>
            )}
          </Link>

          <div>
            <Link
              to={`/profile/${post.user_id}`}
              className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-emerald-500 transition-colors"
            >
              {post.author_name}
            </Link>

            <p className="text-xs text-zinc-500">
              {post.role} @{' '}
              <span className="text-zinc-600 dark:text-zinc-400">
                {post.startup_name}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="text-xs text-zinc-400 dark:text-zinc-600">
  {formatDistanceToNow(new Date(post.created_at + 'Z'), { addSuffix: true })}
</span>

          {currentUser && currentUser.id !== post.user_id && (
            <button
              onClick={handleCoBuild}
              disabled={isCoBuilding}
              className={`
                px-4 py-1.5
                rounded-xl
                text-xs font-semibold
                transition-all duration-200
                border
                transform active:scale-95
                ${
                  post.is_co_building
                    ? 'bg-emerald-500 text-zinc-950 border-emerald-500 shadow-sm'
                    : 'bg-zinc-900 dark:bg-zinc-800 text-white border-zinc-800 dark:border-zinc-700 hover:bg-emerald-500 hover:text-zinc-950 hover:border-emerald-500 hover:shadow-md'
                }
                ${isCoBuilding ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            >
              {isCoBuilding
                ? 'Updating...'
                : post.is_co_building
                ? 'Co-building'
                : 'Co-build'}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="mb-4">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 outline-none resize-none min-h-[100px]"
            autoFocus
          />

          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(post.content);
              }}
              className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              disabled={isSaving}
            >
              <X className="w-4 h-4" />
            </button>

            <button
              onClick={handleSave}
              className="p-2 bg-emerald-500 text-zinc-950 rounded-lg hover:bg-emerald-400 transition-colors"
              disabled={isSaving || !editContent.trim()}
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed mb-4 whitespace-pre-wrap">
          {post.content}
        </p>
      )}

      {/* Media */}
      {post.media_url && (
        <div className="mb-6 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950">
          {post.media_type === 'video' ? (
            <video
              src={post.media_url}
              controls
              className="w-full max-h-[500px] object-contain"
              preload="metadata"
            />
          ) : (
            <img
              src={post.media_url}
              alt="Post media"
              className="w-full max-h-[500px] object-contain"
              loading="lazy"
            />
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex gap-6">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-2 ${
              post.is_liked
                ? 'text-rose-500'
                : 'text-zinc-500 hover:text-rose-500'
            }`}
          >
            <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{post.likes_count}</span>
          </button>

          <button
            onClick={() => onCommentClick(post.id)}
            className="flex items-center gap-2 text-zinc-500 hover:text-emerald-500"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm font-medium">
              {post.comments_count}
            </span>
          </button>
        </div>

        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onReport(post.id)}
            className="p-2 text-zinc-600 hover:text-orange-500 hover:bg-orange-500/10 rounded-full"
            title="Report Post"
          >
            <Flag className="w-4 h-4" />
          </button>

          {currentUser?.id === post.user_id && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-zinc-600 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-full"
                title="Edit Post"
              >
                <Pencil className="w-4 h-4" />
              </button>

              <button
                onClick={() => onDelete(post.id)}
                className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-full"
                title="Delete Post"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}