import { useState, useEffect } from 'react';
import { Comment, User } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { Send, Reply, CornerDownRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CommentSectionProps {
  postId: number;
  currentUser: User | null;
}

export default function CommentSection({ postId, currentUser }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      const contentType = res.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      if (res.ok) {
        if (isJson) {
          const data = await res.json();
          setComments(data);
        } else {
          const text = await res.text();
          console.error('Expected JSON but got:', text.substring(0, 100));
        }
      } else {
        const errorText = isJson ? (await res.json()).error : await res.text();
        console.error(`Fetch comments failed with status ${res.status}:`, errorText);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: newComment,
          parent_id: replyTo ? replyTo.id : null
        }),
      });
      if (res.ok) {
        setNewComment('');
        setReplyTo(null);
        fetchComments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const rootComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId: number) => comments.filter(c => c.parent_id === parentId);

  const CommentItem = ({ comment, isReply = false }: { comment: Comment, isReply?: boolean }) => (
    <div className={`flex gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800/50 ${isReply ? 'ml-8 mt-2' : ''}`}>
      <Link to={`/profile/${comment.user_id}`} className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center border border-zinc-300 dark:border-zinc-700 shrink-0 hover:opacity-80 transition-opacity">
        <span className="text-xs font-bold text-emerald-500">{comment.author_name[0]}</span>
      </Link>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <Link to={`/profile/${comment.user_id}`} className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:text-emerald-500 transition-colors">
            {comment.author_name}
          </Link>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-600">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{comment.content}</p>
        {!isReply && (
          <button 
            onClick={() => {
              setReplyTo(comment);
              setNewComment(`@${comment.author_name} `);
            }}
            className="mt-2 flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-emerald-500 transition-colors uppercase tracking-wider"
          >
            <Reply className="w-3 h-3" />
            Reply
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="mt-4 space-y-4">
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-4 text-zinc-500 text-sm">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4 text-zinc-400 dark:text-zinc-600 text-sm italic">No comments yet. Be the first to reply.</div>
        ) : (
          rootComments.map((comment) => (
            <div key={comment.id}>
              <CommentItem comment={comment} />
              {getReplies(comment.id).map(reply => (
                <div key={reply.id} className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800 ml-[-1px]" />
                  <CommentItem comment={reply} isReply />
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="relative">
        {replyTo && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-500/10 border-x border-t border-emerald-500/20 rounded-t-xl text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            <div className="flex items-center gap-1">
              <CornerDownRight className="w-3 h-3" />
              Replying to {replyTo.author_name}
            </div>
            <button 
              type="button" 
              onClick={() => {
                setReplyTo(null);
                setNewComment('');
              }}
              className="hover:text-emerald-700 dark:hover:text-emerald-300"
            >
              Cancel
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyTo ? "Write a reply..." : "Add a comment..."}
            className={`flex-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors text-zinc-900 dark:text-zinc-100 ${replyTo ? 'rounded-b-xl' : 'rounded-xl'}`}
          />
          <button 
            type="submit"
            className="p-2 bg-emerald-500 text-zinc-950 rounded-xl hover:bg-emerald-400 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
