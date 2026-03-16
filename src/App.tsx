import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, Link } from 'react-router-dom';
import { User, Post } from './types';
import Navbar from './components/Navbar';
import PostCard from './components/PostCard';
import CommentSection from './components/CommentSection';
import MessagesPage from './pages/MessagesPage';
import LaunchPage from './pages/LaunchPage';
import { Rocket, Send, ShieldAlert, User as UserIcon, MapPin, Link as LinkIcon, Image as ImageIcon, Video, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { io } from 'socket.io-client';
import { useLocation } from "react-router-dom";
import SearchPage from "./pages/SearchPage";
import LeftMiniSidebar from "./components/LeftMiniSidebar";
import StoriesPage from "./pages/StoriesPage";
import NewStoryPage from "./pages/NewStoryPage";
import StoryDetailPage from "./pages/StoryDetailPage";
import QAPage from "./pages/QAPage";
import AskQuestionPage from "./pages/AskQuestionPage";
import QuestionDetailPage from "./pages/QuestionDetailPage";
import InvestorList from "./pages/InvestorList";
import CreateInvestor from "./pages/CreateInvestor";
import InvestorDetails from "./pages/InvestorDetails";
import FindPartnerPage from "./pages/FindPartnerPage";
import { supabase } from "./lib/supabase";



const socket = io("https://founder-feed-final.onrender.com");

const API_URL = "https://founder-feed-final.onrender.com";

async function authFetch(url: string, options: any = {}) {
  const token = await supabase.auth.getSession().then((res) => res.data.session?.access_token);

  return fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });
}

// --- Components ---

function AuthPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [startup, setStartup] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      let userCredential;

 if (isLogin) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
}

      const { data } = await supabase.auth.getSession();
const token = data.session?.access_token;

      const res = await fetch(`${API_URL}/api/auth/bootstrap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          startup_name: startup,
          role
        })
      });

      let userData: any = null;

      try {
        userData = await res.json();
      } catch {
        userData = null;
      }

      if (!res.ok) {
        console.warn("Bootstrap failed but continuing login", userData);
      }

      const { data: sessionData } = await supabase.auth.getSession();

const user = userData || {
  id: sessionData.session?.user.id,
  email: sessionData.session?.user.email,
  name: name || "User",
  startup_name: startup || "",
  role: role || "founder",
  profile_picture: null,
  bio: "",
  website: "",
  location: ""
};

      onLogin(user as any);
      navigate("/");

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Authentication failed");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl dark:shadow-2xl"
      >
        <div className="flex justify-center mb-8">
          <div className="bg-emerald-500 p-3 rounded-2xl">
            <Rocket className="w-8 h-8 text-zinc-950" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2 text-zinc-900 dark:text-zinc-100">
          {isLogin ? 'Welcome Back' : 'Join the Network'}
        </h1>
        <p className="text-zinc-500 text-center mb-8 text-sm">
          {isLogin ? 'Connect with fellow founders' : 'Exclusive for startup founders and builders'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors text-zinc-900 dark:text-zinc-100"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Startup Name"
                  required
                  value={startup}
                  onChange={(e) => setStartup(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors text-zinc-900 dark:text-zinc-100"
                />
                <input
                  type="text"
                  placeholder="Role (e.g. CEO)"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </>
          )}

          <input
            type="email"
            placeholder="Email Address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors text-zinc-900 dark:text-zinc-100"
          />

          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors text-zinc-900 dark:text-zinc-100"
          />

          {error && <p className="text-red-500 text-xs text-center">{error}</p>}

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3 rounded-xl transition-colors mt-4"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-zinc-500 hover:text-emerald-500 text-sm transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function FeedPage({ currentUser }: { currentUser: User | null }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [newPost, setNewPost] = useState('');
  const [media, setMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [activeComments, setActiveComments] = useState<number | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [coBuildings, setCoBuildings] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPosts(true);
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
     const res = await authFetch('/api/users/suggested');
      if (res.ok) {
        const data = await res.json();
        setSuggestedUsers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchPosts(false);
        }
      },
      { threshold: 1.0 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, offset]);

  const fetchPosts = async (reset = false) => {
    if (reset) {
      if (posts.length === 0) setLoading(true);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    const currentOffset = reset ? 0 : offset;
    try {
const res = await authFetch(`/api/posts?limit=10&offset=${currentOffset}`);      const contentType = res.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      if (res.ok) {
        if (isJson) {
          const data = await res.json();
          setHasMore(data.length === 10);
          if (reset) {
            setPosts(data);
            setOffset(data.length);
          } else {
            setPosts(prev => [...prev, ...data]);
            setOffset(prev => prev + data.length);
          }
        } else {
          const text = await res.text();
          console.error(`Expected JSON but got: ${res.status} ${res.statusText}`, text.substring(0, 200));
        }
      } else {
        const errorText = isJson ? (await res.json()).error : await res.text();
        console.error(`Fetch failed with status ${res.status}:`, errorText);
      }
    } catch (err) {
      console.error('Fetch posts error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMedia(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleCreatePost called', { newPost, hasMedia: !!media });
    if ((!newPost.trim() && !media) || newPost.length > 500) {
      console.log('Post validation failed');
      return;
    }

    setIsPosting(true);
    setPostError(null);
    const formData = new FormData();
    formData.append('content', newPost);
    if (media) formData.append('media', media);

    try {
      console.log('Sending POST request to /api/posts');
    const res = await authFetch('/api/posts', {
  method: 'POST',
  body: formData,
});
      
      const contentType = res.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      console.log('POST response status:', res.status);
      if (res.ok) {
        console.log('Post created successfully, refreshing feed');
        setNewPost('');
        setMedia(null);
        setMediaPreview(null);
        fetchPosts(true);
      } else {
        const errData = isJson ? await res.json() : { error: await res.text() };
        setPostError(errData.error || 'Failed to create post');
      }
    } catch (err) {
      console.error(err);
      setPostError('Network error. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (id: number) => {
    try {
      const res = await authFetch(`/api/posts/${id}/like`, { method: 'POST' });
      if (res.ok) {
        setPosts(posts.map(p => {
          if (p.id === id) {
            const liked = !p.is_liked;
            return { ...p, is_liked: liked ? 1 : 0, likes_count: p.likes_count + (liked ? 1 : -1) };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    console.log('handleDelete called for post:', id);
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      console.log('Sending DELETE request for post:', id);
      const res = await authFetch(`/api/posts/${id}`, { method: 'DELETE' });
      console.log('DELETE response status:', res.status);
      if (res.ok) {
        console.log('Delete successful, updating state');
        setPosts(prevPosts => prevPosts.filter(p => p.id !== id));
      } else {
        const data = await res.json();
        console.error('Delete failed:', data);
        alert(data.error || 'Failed to delete post');
      }
    } catch (err) {
      console.error('Delete network error:', err);
      alert('Network error. Please try again.');
    }
  };

  const handleEdit = async (id: number, content: string) => {
    try {
      const res = await authFetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        setPosts(posts.map(p => p.id === id ? { ...p, content } : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReport = async (id: number) => {
    const reason = prompt('Why are you reporting this post?');
    if (!reason) return;
    try {
     const res = await authFetch(`/api/posts/${id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) alert('Thank you for reporting. Our team will review it.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCoBuild = (authorId: number) => {
    setPosts(prev => prev.map(p => 
      p.user_id === authorId 
        ? { ...p, is_co_building: p.is_co_building ? 0 : 1 } 
        : p
    ));
  };

 return (
  <div className="py-8 w-full">
  
      {/* MAIN FEED + RIGHT PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8">
        <form onSubmit={handleCreatePost} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 mb-8 shadow-sm dark:shadow-none">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's on your mind, founder?"
            className="w-full bg-transparent border-none focus:ring-0 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 resize-none min-h-[100px]"
            maxLength={500}
          />
          
          {mediaPreview && (
            <div className="relative mb-4 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
              <button 
                type="button"
                onClick={() => { setMedia(null); setMediaPreview(null); }}
                className="absolute top-2 right-2 p-1.5 bg-zinc-900/80 text-white rounded-full hover:bg-zinc-900 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>
              {media?.type.startsWith('video') ? (
                <video src={mediaPreview} className="w-full max-h-[300px] object-contain bg-black" controls />
              ) : (
                <img src={mediaPreview} alt="Preview" className="w-full max-h-[300px] object-contain bg-zinc-50 dark:bg-zinc-950" />
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-full transition-all"
                title="Add Media"
                disabled={isPosting}
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleMediaChange} 
                accept="image/*,video/*" 
                className="hidden" 
              />
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-xs ${newPost.length > 450 ? 'text-orange-500' : 'text-zinc-400 dark:text-zinc-600'}`}>
                {newPost.length} / 500
              </span>
              <button 
                type="submit"
                disabled={(!newPost.trim() && !media) || isPosting}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 text-zinc-950 px-6 py-2 rounded-full text-sm font-bold transition-colors flex items-center gap-2"
              >
                {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isPosting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
          {postError && (
            <p className="text-red-500 text-xs mt-3 text-center">{postError}</p>
          )}
        </form>

        <div className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
              <p className="text-zinc-500 text-sm">Fetching insights...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <Rocket className="w-12 h-12 text-zinc-300 dark:text-zinc-800 mx-auto mb-4" />
              <h3 className="text-zinc-500 dark:text-zinc-400 font-medium">The feed is quiet...</h3>
              <p className="text-zinc-400 dark:text-zinc-600 text-sm">Be the first to share a startup update.</p>
            </div>
          ) : (
            <>
              {posts.map(post => (
                <div key={post.id} className="space-y-2">
                  <PostCard 
                    post={post} 
                    currentUser={currentUser}
                    onLike={handleLike}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onReport={handleReport}
                    onCommentClick={(id) => setActiveComments(activeComments === id ? null : id)}
                    onCoBuild={handleCoBuild}
                  />
                  <AnimatePresence>
                    {activeComments === post.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-zinc-50 dark:bg-zinc-900/30 border-x border-b border-zinc-200 dark:border-zinc-800 rounded-b-2xl p-4 -mt-2 mx-2">
                          <CommentSection postId={post.id} currentUser={currentUser} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
              
              <div ref={loaderRef} className="py-8 flex justify-center">
                {hasMore && <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />}
                {!hasMore && posts.length > 0 && <p className="text-zinc-500 text-xs">You've reached the end of the feed.</p>}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm dark:shadow-none sticky top-24">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <Rocket className="w-4 h-4 text-emerald-500" />
            Co-build with Founders
          </h3>
          <div className="space-y-4">
            {suggestedUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between gap-3">
                <Link to={`/profile/${user.id}`} className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 overflow-hidden group-hover:opacity-80 transition-opacity">
                    {user.profile_picture ? (
                      <img src={user.profile_picture} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-5 h-5 text-zinc-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-emerald-500 transition-colors">{user.name}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{user.role} @ {user.startup_name}</p>
                  </div>
                </Link>
                <button 
                  onClick={async () => {
                    try {
                      const res = await authFetch(`/api/users/${user.id}/co-build`, {
  method: 'POST'
});
                      if (res.ok) {
                        setSuggestedUsers(prev => prev.filter(u => u.id !== user.id));
                        setCoBuildings(prev => {
                          const updated = new Set(prev);
                          updated.add(user.id);
                          return updated;
                        });
                        handleCoBuild(user.id);
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }}
className={`
px-4 py-2
rounded-xl
text-xs font-semibold
transition-all duration-200
shadow-sm
${coBuildings.has(user.id)
  ? 'bg-emerald-500 text-zinc-950 border border-emerald-500' 
  : 'bg-zinc-900 dark:bg-zinc-800 text-white border border-zinc-800 dark:border-zinc-700 hover:bg-emerald-500 hover:text-zinc-950 hover:border-emerald-500 hover:shadow-md'
}
`}                             >
                  Co-build
                </button>
              </div>
            ))}

            {suggestedUsers.length === 0 && (
              <p className="text-xs text-zinc-500 text-center py-4">
                No suggestions right now.
              </p>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-[10px] text-zinc-400 dark:text-zinc-600 leading-relaxed">
              FounderFeed is a community of builders. Co-build with others to see their updates in your network.
            </p>
          </div>

        </div>
      </div>

    </div>
  </div>
);
}
function ProfilePage({ currentUser, onUpdate }: { currentUser: User | null, onUpdate: (user: User) => void }) {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isCoBuilding, setIsCoBuilding] = useState(false);

  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  useEffect(() => {
  if (isMessageOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'auto';
  }

  return () => {
    document.body.style.overflow = 'auto';
  };
}, [isMessageOpen]);

  const [posts, setPosts] = useState<any[]>([]);
const [postsLoading, setPostsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    startup_name: '',
    role: '',
    bio: '',
    website: '',
    location: '',
    profile_picture: '',
  });
  const fetchUserPosts = async (userId: string | number) => {
  setPostsLoading(true);
  try {
    const res = await authFetch(`/api/posts/user/${userId}`);
    if (res.ok) {
      const data = await res.json();
      setPosts(data);
    }
  } catch (err) {
    console.error("Failed to fetch posts:", err);
  } finally {
    setPostsLoading(false);
  }
};

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const targetId = id || currentUser?.id;
        if (!targetId) return;
      const res = await authFetch(`/api/users/${targetId}`);
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          fetchUserPosts(targetId);
          
          if (!id || Number(id) === currentUser?.id) {
            setFormData({
              name: data.name || '',
              startup_name: data.startup_name || '',
              role: data.role || '',
              bio: data.bio || '',
              website: data.website || '',
              location: data.location || '',
              profile_picture: data.profile_picture || '',
            });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, currentUser]);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profile_picture: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoBuild = async () => {
    if (!user || !currentUser) return;
    setIsCoBuilding(true);
    try {
     const res = await authFetch(`/api/users/${user.id}/co-build`, {
  method: 'POST'
});
      if (res.ok) {
        const data = await res.json();
        setUser(prev => prev ? { 
          ...prev, 
          is_co_building: data.co_building ? 1 : 0,
          co_builders_count: (prev.co_builders_count || 0) + (data.co_building ? 1 : -1)
        } : null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCoBuilding(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user) return;

    setSendingMessage(true);

    try {
     const res = await authFetch('/api/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    receiver_id: user.id,
    content: messageText,
  }),
});
      if (res.ok) {
        setMessageText('');
        setIsMessageOpen(false);
        alert('Message sent successfully 🚀');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'profile_picture') data.append(key, value);
    });
    if (avatarFile) data.append('avatar', avatarFile);
    else if (formData.profile_picture) data.append('profile_picture', formData.profile_picture);

    try {
     const res = await authFetch('/api/profile', {
  method: 'PUT',
  body: data,
});
      if (res.ok) {
        const result = await res.json();
        const updatedUser = { ...user!, ...formData, profile_picture: result.profile_picture };
        setUser(updatedUser);
        onUpdate(updatedUser);
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
    }
  };


  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
    </div>
  );
  if (!user) return <div className="text-center py-20 text-zinc-500">User not found</div>;

  const isOwnProfile = !id || Number(id) === currentUser?.id;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm dark:shadow-none">
    
        <div className="h-32 bg-gradient-to-r from-emerald-600 to-teal-600" />
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            
            <div 
            
        
              className={`w-24 h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-4 border-white dark:border-zinc-900 flex items-center justify-center overflow-hidden shadow-xl ${isEditing ? 'cursor-pointer group' : ''}`}
              onClick={() => isEditing && avatarInputRef.current?.click()}
              
            >
              {isOwnProfile ? (
                formData.profile_picture ? (
                  <img src={formData.profile_picture} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-10 h-10 text-zinc-400 dark:text-zinc-600" />
                )
              ) : (
                user.profile_picture ? (
                  <img src={user.profile_picture} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-10 h-10 text-zinc-400 dark:text-zinc-600" />
                )
              )}
              {isEditing && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
            
            
           {isOwnProfile ? (
  !isEditing && (
    <button 
      onClick={() => setIsEditing(true)}
      className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 px-6 py-2 rounded-xl text-sm font-semibold transition-colors border border-zinc-200 dark:border-zinc-700"
    >
      Edit Profile
    </button>
  )
) : (
  <button 
    onClick={handleCoBuild}
    disabled={isCoBuilding}
    className={`px-6 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
      user.is_co_building
        ? 'bg-emerald-500 text-zinc-950'
        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-emerald-500 hover:text-zinc-950'
    }`}
  >
    {user.is_co_building ? 'Co-building' : 'Co-build'}
  </button>
)}
          </div>

          {!isEditing ? (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">{user.name}</h1>
                <p className="text-emerald-500 font-medium">{user.role} @ {user.startup_name}</p>
              </div>

              {user.bio && <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{user.bio}</p>}

              <div className="flex flex-wrap gap-4 text-sm text-zinc-500">

  <div className="flex items-center justify-between w-full mb-2">

    <div className="flex items-center gap-6">
      <div className="flex flex-col">
        <span className="text-zinc-900 dark:text-zinc-100 font-bold text-lg">
          {user.co_builders_count || 0}
        </span>
        <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">
          Co-builders
        </span>
      </div>

      <div className="flex flex-col">
        <span className="text-zinc-900 dark:text-zinc-100 font-bold text-lg">
          {user.co_building_count || 0}
        </span>
        <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">
          Co-building
        </span>
      </div>
    </div>

  {!isOwnProfile && (
<button
  onClick={() => setIsMessageOpen(true)}
  className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-zinc-900 text-white hover:bg-emerald-500 hover:text-zinc-950 transition-all"
>
  Message
</button>
  )}
  </div>

  <div className="w-full flex flex-wrap gap-4">
    {user.location && (
      <div className="flex items-center gap-1.5">
        <MapPin className="w-4 h-4" />
        {user.location}
      </div>
    )}

    {user.website && (
      <a
        href={user.website}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 hover:text-emerald-500 transition-colors"
      >
        <LinkIcon className="w-4 h-4" />
        {user.website.replace(/^https?:\/\//, '')}
      </a>
    )}
  </div>
  

</div>

            </div>
          )
           : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500 transition-colors text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Startup</label>
                  <input
                    type="text"
                    value={formData.startup_name}
                    onChange={(e) => setFormData({ ...formData, startup_name: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500 transition-colors text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Role</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500 transition-colors text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500 transition-colors min-h-[100px] text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Website</label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500 transition-colors text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500 transition-colors text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>
                <button 
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3 rounded-xl transition-colors mt-4"
                >
                Save Changes
                </button>
              </form>
          )}
        </div>
      </div>

      {/*  Recent Posts Section */}
      <div className="mt-10">
        <h2 className="text-xl font-bold mb-6 text-center tracking-wide">
          Recent Posts
        </h2>

        {postsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <p className="text-zinc-500 text-center">No posts yet.</p>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                onLike={() => {}}
                onDelete={() => {}}
                onEdit={async (id: number, content: string) => {}}
                onReport={() => {}}
                onCommentClick={() => {}}
                onCoBuild={() => {}}
              />
            ))}
          </div>
        )}


   {isMessageOpen &&
  createPortal(
    <div
  className="fixed inset-0 z-[9999] bg-black/50 
             flex items-center justify-center 
             p-4 w-screen h-screen"
      onClick={() => setIsMessageOpen(false)}
    >
      <div
        className="bg-white dark:bg-zinc-900 
           w-[95%] sm:w-full 
           max-w-sm sm:max-w-md 
           rounded-2xl 
           p-5 sm:p-6 
           shadow-xl 
           max-h-[75vh] sm:max-h-[90vh] 
           overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-4">Send Message</h3>

        <textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Write your message..."
          className="w-full border rounded-xl p-3 bg-zinc-50 dark:bg-zinc-800 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
          rows={4}
        />

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={() => setIsMessageOpen(false)}
            className="px-4 py-2 text-sm"
          >
            Cancel
          </button>

          <button
            onClick={handleSendMessage}
            disabled={sendingMessage}
            className="bg-emerald-500 hover:bg-emerald-400 px-4 py-2 rounded-lg text-zinc-950 font-bold disabled:opacity-50"
          >
            {sendingMessage ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )}
      </div>
    </div>
    
  );
  
}

function AdminPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
   authFetch('/api/admin/reports')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch reports');
        return res.json();
      })
      .then(data => {
        setReports(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="flex items-center gap-3 mb-8">
        <ShieldAlert className="w-8 h-8 text-orange-500" />
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Moderation Dashboard</h1>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm dark:shadow-none">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Reporter</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Post Content</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Reason</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-500">Loading reports...</td></tr>
            ) : reports.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-500 italic">No reports found.</td></tr>
            ) : (
              reports.map(report => (
                <tr key={report.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-200">{report.reporter_name}</td>
                  <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400 max-w-xs truncate">{report.post_content}</td>
                  <td className="px-6 py-4 text-sm text-orange-500">{report.reason}</td>
                  <td className="px-6 py-4 text-sm text-zinc-400 dark:text-zinc-600">{new Date(report.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function Layout({ children, user }: { children: React.ReactNode; user: User | null }) {
  const location = useLocation();

  const showSidebar =
    location.pathname === "/" ||
    location.pathname.startsWith("/stories") ||
    location.pathname.startsWith("/qa") ||
    location.pathname.startsWith("/investors") ||
    location.pathname.startsWith("/find-partner");

  return (
    <div className="max-w-7xl mx-auto px-4 flex gap-6">
      {showSidebar && user && <LeftMiniSidebar />}
      <div className="flex-1">{children}</div>
    </div>
  );
}

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [unreadCount, setUnreadCount] = useState(0);

useEffect(() => {
  const checkSession = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        setUser(null);
        setLoading(false);
        return;
      }

      const token = session.access_token;

      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }

    } catch (err) {
      console.error("Auth check failed:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  checkSession();
}, []);
  const handleLogout = async () => {
  await supabase.auth.signOut();
  setUser(null);
};
  useEffect(() => {
  if (!user) return;

  socket.emit('join', user.id);

  authFetch('/api/conversations')
    .then(res => res.json())
    .then(data => {
      const totalUnread = data.reduce(
        (sum: number, conv: any) => sum + (conv.unread_count || 0),
        0
      );
      setUnreadCount(totalUnread);
    });

  socket.on('receive_message', (message) => {
    if (message.sender_id !== user.id) {
      setUnreadCount(prev => prev + 1);
    }
  });

  return () => {
    socket.off('receive_message');
  };
}, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-emerald-500/30 transition-colors duration-200">
       <Navbar
  user={user}
  onLogout={handleLogout}
  unreadCount={unreadCount}   
/>

       
      <main>
  <Layout user={user}>
    <Routes>
    <Route path="/" element={user ? <FeedPage currentUser={user} /> : <Navigate to="/auth" />} />
    <Route path="/auth" element={!user ? <AuthPage onLogin={setUser} /> : <Navigate to="/" />} />
    <Route path="/profile" element={user ? <ProfilePage currentUser={user} onUpdate={setUser} /> : <Navigate to="/auth" />} />
    <Route path="/profile/:id" element={user ? <ProfilePage currentUser={user} onUpdate={setUser} /> : <Navigate to="/auth" />} />
    <Route path="/messages" element={user ? <MessagesPage currentUser={user} setUnreadCount={setUnreadCount} socket={socket} /> : <Navigate to="/auth" />} />
    <Route path="/launch" element={user ? <LaunchPage currentUser={user} /> : <Navigate to="/auth" />} />
    <Route path="/admin" element={user ? <AdminPage /> : <Navigate to="/auth" />} />
    <Route
  path="/qa"
  element={user ? <QAPage currentUser={user} /> : <Navigate to="/auth" />}
/>
<Route
  path="/find-partner"
  element={user ? <FindPartnerPage currentUser={user} /> : <Navigate to="/auth" />}
/>
<Route
  path="/qa/new"
  element={user ? <AskQuestionPage currentUser={user} /> : <Navigate to="/auth" />}
/>


<Route
  path="/qa/:id"
  element={user ? <QuestionDetailPage currentUser={user} /> : <Navigate to="/auth" />}
/>
<Route path="/stories" element={user ? <StoriesPage currentUser={user} /> : <Navigate to="/auth" />} />
<Route path="/stories/new" element={user ? <NewStoryPage currentUser={user} /> : <Navigate to="/auth" />} />
<Route
  path="/stories/:id"
  element={user ? <StoryDetailPage currentUser={user} /> : <Navigate to="/auth" />}
/>

{/* 💰 INVESTOR ROUTES */}

<Route
  path="/investors"
  element={user ? <InvestorList /> : <Navigate to="/auth" />}
/>

<Route
  path="/investors/new"
  element={user ? <CreateInvestor /> : <Navigate to="/auth" />}
/>

<Route
  path="/investors/:id"
  element={user ? <InvestorDetails /> : <Navigate to="/auth" />}
/>
    {/* 🔎 SEARCH ROUTE */}
    <Route
  path="/search"
  element={user ? <SearchPage currentUser={user} /> : <Navigate to="/auth" />}
/>
      </Routes>
  </Layout>
</main>

        <footer className="py-12 border-t border-zinc-100 dark:border-zinc-900 mt-20">
          <div className="max-w-4xl mx-auto px-4 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 opacity-30 dark:opacity-50">
              <Rocket className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
              <span className="text-xs font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100">FounderFeed</span>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
