import { useState, useEffect } from 'react';
import { User, Product, ProductComment } from '../types';
import { Rocket, Plus, ExternalLink, Heart, MessageSquare, Globe, Trash2, X, Image as ImageIcon, Loader2, Reply, CornerDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

interface LaunchPageProps {
  currentUser: User;
}

export default function LaunchPage({ currentUser }: LaunchPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [problem, setProblem] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !problem || !website || !description) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('problem_solved', problem);
    formData.append('website', website);
    formData.append('short_description', description);
    if (image) formData.append('image', image);

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setIsModalOpen(false);
        setName('');
        setProblem('');
        setWebsite('');
        setDescription('');
        setImage(null);
        setImagePreview(null);
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleLike = async (productId: number) => {
    try {
      const res = await fetch(`/api/products/${productId}/like`, { method: 'POST' });
      if (res.ok) {
        const { liked } = await res.json();
        setProducts(prev => prev.map(p => {
          if (p.id === productId) {
            return {
              ...p,
              is_liked: liked ? 1 : 0,
              likes_count: liked ? p.likes_count + 1 : p.likes_count - 1
            };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Launchpad</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Discover and support the next generation of startups.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-5 h-5" />
          Launch Your Product
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <Rocket className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">No products launched yet</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Be the first to launch your product to the community!</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onLike={() => toggleLike(product.id)}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}

      {/* Launch Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800"
            >
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="text-xl font-bold">Launch Your Product</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Product Name</label>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="What's it called?"
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Short Description (Max 200 chars)</label>
                  <input 
                    type="text" 
                    required
                    maxLength={200}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Elevator pitch in one sentence..."
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Problem it Solves</label>
                  <textarea 
                    required
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    placeholder="What pain point are you addressing?"
                    rows={4}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Website URL</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      type="url" 
                      required
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yourstartup.com"
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Product Image (Optional)</label>
                  <div 
                    onClick={() => document.getElementById('product-image')?.click()}
                    className="relative aspect-video rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 transition-colors overflow-hidden"
                  >
                    {imagePreview ? (
                      <img src={imagePreview} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-zinc-400 mb-2" />
                        <span className="text-sm text-zinc-500">Click to upload product screenshot</span>
                      </>
                    )}
                    <input 
                      id="product-image"
                      type="file" 
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
                    Launch Product
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductCard({ product, onLike, currentUser }: { product: Product, onLike: () => void, currentUser: User }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<ProductComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<ProductComment | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/products/${product.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`/api/products/${product.id}/comments`, {
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

  const deleteComment = async (commentId: number) => {
    try {
      const res = await fetch(`/api/products/${product.id}/comments/${commentId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchComments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const rootComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId: number) => comments.filter(c => c.parent_id === parentId);

  const CommentItem = ({ comment, isReply = false }: { comment: ProductComment, isReply?: boolean }) => (
    <div className={`flex gap-3 ${isReply ? 'ml-8 mt-4' : ''}`}>
      <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex-shrink-0 overflow-hidden border border-zinc-300 dark:border-zinc-700">
        {comment.author_avatar ? (
          <img src={comment.author_avatar} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-emerald-500 font-bold text-xs">
            {comment.author_name[0]}
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-bold">{comment.author_name}</span>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-600">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
            {comment.user_id === currentUser.id && (
              <button 
                onClick={() => deleteComment(comment.id)}
                className="text-zinc-400 hover:text-rose-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all group"
    >
      <div className="flex flex-col md:flex-row">
        {product.image_url && (
          <div className="md:w-72 h-48 md:h-auto overflow-hidden shrink-0">
            <img 
              src={product.image_url} 
              alt={product.name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            />
          </div>
        )}
        <div className="flex-1 p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-500 transition-colors">{product.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Link to={`/profile/${product.user_id}`} className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-emerald-500 transition-colors">
                  by {product.founder_name}
                </Link>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="text-xs text-zinc-400 dark:text-zinc-600">
                  {formatDistanceToNow(new Date(product.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
            <a 
              href={product.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 rounded-2xl transition-all"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>

          <p className="text-lg font-medium text-zinc-800 dark:text-zinc-200 mb-4">{product.short_description}</p>
          
          <div className="bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl p-4 mb-6 border border-zinc-100 dark:border-zinc-800/50">
            <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-2">The Problem</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">"{product.problem_solved}"</p>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={onLike}
              className={`flex items-center gap-2 text-sm font-bold transition-colors ${product.is_liked ? 'text-rose-500' : 'text-zinc-500 hover:text-rose-500'}`}
            >
              <Heart className={`w-5 h-5 ${product.is_liked ? 'fill-current' : ''}`} />
              {product.likes_count}
            </button>
            <button 
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-2 text-sm font-bold transition-colors ${showComments ? 'text-emerald-500' : 'text-zinc-500 hover:text-emerald-500'}`}
            >
              <MessageSquare className="w-5 h-5" />
              {product.comments_count}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 overflow-hidden"
          >
            <div className="p-6 md:p-8">
              <form onSubmit={handleComment} className="relative mb-8">
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
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={replyTo ? "Write a reply..." : "Give some feedback..."}
                    className={`flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors text-zinc-900 dark:text-zinc-100 ${replyTo ? 'rounded-b-2xl' : 'rounded-2xl'}`}
                  />
                  <button 
                    type="submit"
                    disabled={!newComment.trim()}
                    className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold px-6 rounded-2xl transition-colors"
                  >
                    Post
                  </button>
                </div>
              </form>

              <div className="space-y-8">
                {loadingComments ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-center text-zinc-500 text-sm italic py-4">No feedback yet. Be the first!</p>
                ) : (
                  rootComments.map(comment => (
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
