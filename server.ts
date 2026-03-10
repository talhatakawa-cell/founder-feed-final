import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database('founderfeed.db');
db.pragma('foreign_keys = ON');
const JWT_SECRET = process.env.JWT_SECRET || 'founder-secret-key-123';

// Patch BigInt to work with JSON.stringify
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ 
  storage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB max
});

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    startup_name TEXT NOT NULL,
    role TEXT NOT NULL,
    bio TEXT,
    website TEXT,
    profile_picture TEXT,
    location TEXT,
    is_verified INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL CHECK(length(content) <= 500),
    media_url TEXT,
    media_type TEXT, -- 'image' | 'video'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS stories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL CHECK(length(content) <= 20000),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

  CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    parent_id INTEGER,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id INTEGER NOT NULL,
    user2_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user1_id, user2_id),
    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS co_builders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    target_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, target_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    problem_solved TEXT NOT NULL,
    website TEXT NOT NULL,
    short_description TEXT NOT NULL CHECK(length(short_description) <= 200),
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS product_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS product_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    parent_id INTEGER,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES product_comments(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS story_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  story_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, story_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS story_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  story_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS story_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  story_id INTEGER NOT NULL,
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  is_best INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS investor_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  startup_name TEXT NOT NULL,
  website_url TEXT,
  launched_date TEXT NOT NULL,
  monthly_revenue TEXT,
  users_count INTEGER NOT NULL,
  amount_raising INTEGER NOT NULL,
  pitch TEXT NOT NULL CHECK(length(pitch) <= 600),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS partner_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  startup_name TEXT NOT NULL,
  website_url TEXT,
  monthly_revenue TEXT,
  needed_role TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

// Migrations for existing tables
try { db.exec("ALTER TABLE posts ADD COLUMN media_url TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE posts ADD COLUMN media_type TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE users ADD COLUMN profile_picture TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE comments ADD COLUMN parent_id INTEGER;"); } catch (e) {}
try { db.exec("ALTER TABLE product_comments ADD COLUMN parent_id INTEGER;"); } catch (e) {}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());
  app.use('/uploads', express.static('uploads'));

  // Request Logger
  app.use((req, res, next) => {
    if (!req.url.startsWith('/@vite') && !req.url.startsWith('/src') && !req.url.startsWith('/node_modules')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    }
    next();
  });

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    try {
      const token = req.cookies.token;
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
          console.error('JWT Verify Error:', err.message);
          return res.status(403).json({ error: 'Forbidden: Invalid session' });
        }
        req.user = user;
        next();
      });
    } catch (error) {
      console.error('Auth Middleware Error:', error);
      res.status(500).json({ error: 'Authentication system error' });
    }
  };

  const apiRouter = express.Router();

  // --- Auth Routes ---
  apiRouter.post('/auth/signup', async (req, res) => {
    const { email, password, name, startup_name, role } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const stmt = db.prepare('INSERT INTO users (email, password, name, startup_name, role) VALUES (?, ?, ?, ?, ?)');
      const result = stmt.run(email, hashedPassword, name, startup_name, role);
      
      const token = jwt.sign({ id: Number(result.lastInsertRowid), email }, JWT_SECRET);
      res.cookie('token', token, { 
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
});
      res.json({ message: 'User created', user: { id: Number(result.lastInsertRowid), email, name, startup_name, role } });
    } catch (err: any) {
      console.error('Signup error:', err);
      res.status(400).json({ error: err.message });
    }
  });

  apiRouter.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = jwt.sign({ id: Number(user.id), email: user.email }, JWT_SECRET);
      res.cookie('token', token, { 
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
});
      res.json({ message: 'Logged in', user: { id: Number(user.id), email: user.email, name: user.name, startup_name: user.startup_name, role: user.role } });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login error' });
    }
  });

  apiRouter.post('/auth/logout', (req, res) => {
    res.clearCookie('token', {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
});
    res.json({ message: 'Logged out' });
  });

  apiRouter.get('/auth/me', authenticateToken, (req: any, res) => {
    try {
      const user: any = db.prepare('SELECT id, email, name, startup_name, role, bio, website, profile_picture, location FROM users WHERE id = ?').get(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  });
  apiRouter.post('/stories', authenticateToken, (req: any, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    if (title.trim().length > 120) {
      return res.status(400).json({ error: 'Title too long (max 120 chars)' });
    }

    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

    if (wordCount > 1000) {
      return res.status(400).json({ error: 'Story exceeds 1000 word limit' });
    }

    const stmt = db.prepare(`
      INSERT INTO stories (user_id, title, content)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(
      req.user.id,
      title.trim(),
      content.trim()
    );

    res.json({
      id: Number(result.lastInsertRowid),
      title: title.trim(),
      content: content.trim(),
      created_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Story creation error:', error);
    res.status(500).json({ error: 'Failed to create story' });
  }
});
apiRouter.get('/stories', authenticateToken, (req: any, res) => {
  try {
    const stories = db.prepare(`
      SELECT 
        s.*, 
        u.name as author_name,
        u.profile_picture as author_avatar,
        (SELECT COUNT(*) FROM story_likes WHERE story_id = s.id) as likes_count,
        (SELECT COUNT(*) FROM story_comments WHERE story_id = s.id) as comments_count,
        (SELECT 1 FROM story_likes WHERE story_id = s.id AND user_id = ?) as is_liked
      FROM stories s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `).all(req.user.id);

    res.json(stories);

  } catch (error: any) {
    console.error('Fetch stories error:', error);
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});
apiRouter.post('/stories/:id/like', authenticateToken, (req: any, res) => {
  try {
    db.prepare('INSERT INTO story_likes (user_id, story_id) VALUES (?, ?)')
      .run(req.user.id, req.params.id);
    res.json({ liked: true });
  } catch {
    db.prepare('DELETE FROM story_likes WHERE user_id = ? AND story_id = ?')
      .run(req.user.id, req.params.id);
    res.json({ liked: false });
  }
});
apiRouter.get('/stories/:id/comments', authenticateToken, (req, res) => {
  const comments = db.prepare(`
    SELECT c.*, u.name as author_name
    FROM story_comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.story_id = ?
    ORDER BY c.created_at ASC
  `).all(req.params.id);

  res.json(comments);
});
apiRouter.post('/stories/:id/comments', authenticateToken, (req: any, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Comment is required" });
    }

    const result = db.prepare(`
      INSERT INTO story_comments (user_id, story_id, content)
      VALUES (?, ?, ?)
    `).run(req.user.id, req.params.id, content.trim());

    res.json({
      id: Number(result.lastInsertRowid),
      content: content.trim(),
    });
  } catch (error: any) {
    console.error("Create story comment error:", error);
    res.status(500).json({ error: "Failed to create comment" });
  }
});
apiRouter.post('/stories/:id/report', authenticateToken, (req: any, res) => {
  const { reason } = req.body;

  db.prepare(`
    INSERT INTO story_reports (user_id, story_id, reason)
    VALUES (?, ?, ?)
  `).run(req.user.id, req.params.id, reason);

  res.json({ reported: true });
});
apiRouter.put('/stories/:id', authenticateToken, (req: any, res) => {
  const { title, content } = req.body;

  const result = db.prepare(`
    UPDATE stories 
    SET title = ?, content = ?
    WHERE id = ? AND user_id = ?
  `).run(title, content, req.params.id, req.user.id);

  if (result.changes === 0)
    return res.status(403).json({ error: 'Unauthorized' });

  res.json({ updated: true });
});
apiRouter.delete('/stories/:id', authenticateToken, (req: any, res) => {
  const result = db.prepare(`
    DELETE FROM stories
    WHERE id = ? AND user_id = ?
  `).run(req.params.id, req.user.id);

  if (result.changes === 0)
    return res.status(403).json({ error: 'Unauthorized' });

  res.json({ deleted: true });
});
apiRouter.get('/stories/:id', authenticateToken, (req: any, res) => {
  try {
    const story = db.prepare(`
      SELECT 
        s.*, 
        u.name as author_name,
        (SELECT COUNT(*) FROM story_likes WHERE story_id = s.id) as likes_count,
        (SELECT COUNT(*) FROM story_comments WHERE story_id = s.id) as comments_count,
        (SELECT 1 FROM story_likes WHERE story_id = s.id AND user_id = ?) as is_liked
      FROM stories s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).get(req.user.id, req.params.id);

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    res.json(story);
  } catch (error: any) {
    console.error('Fetch single story error:', error);
    res.status(500).json({ error: 'Failed to fetch story' });
  }
});

  // --- Post Routes ---
  apiRouter.get('/posts', authenticateToken, (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      const posts = db.prepare(`
        SELECT p.*, u.name as author_name, u.startup_name, u.role, u.profile_picture as author_avatar,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
        (SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked,
        (SELECT 1 FROM co_builders WHERE user_id = ? AND target_id = p.user_id) as is_co_building
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `).all(req.user.id, req.user.id, limit, offset);
      
      res.json(posts);
    } catch (error: any) {
      console.error('Fetch posts error:', error);
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  });
  apiRouter.get('/posts/user/:userId', authenticateToken, (req: any, res) => {
  try {
    const userId = Number(req.params.userId);

    const posts = db.prepare(`
      SELECT p.*, u.name as author_name, u.startup_name, u.role, u.profile_picture as author_avatar,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
      (SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked,
      (SELECT 1 FROM co_builders WHERE user_id = ? AND target_id = p.user_id) as is_co_building
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `).all(req.user.id, req.user.id, userId);

    res.json(posts);
  } catch (error: any) {
    console.error('Fetch user posts error:', error);
    res.status(500).json({ error: 'Failed to fetch user posts' });
  }
});

  apiRouter.post('/posts', authenticateToken, upload.single('media'), (req: any, res) => {
    try {
      const { content } = req.body;
      const media_url = req.file ? `/uploads/${req.file.filename}` : null;
      const media_type = req.file ? (req.file.mimetype.startsWith('video') ? 'video' : 'image') : null;

      if ((!content || content.trim().length === 0) && !media_url) {
        return res.status(400).json({ error: 'Content or media is required' });
      }
      
      if (content && content.length > 500) {
        return res.status(400).json({ error: 'Content too long (max 500 chars)' });
      }
      
      const finalContent = content || '';
      const stmt = db.prepare('INSERT INTO posts (user_id, content, media_url, media_type) VALUES (?, ?, ?, ?)');
      const result = stmt.run(req.user.id, finalContent, media_url, media_type);
      
      res.json({ 
        id: Number(result.lastInsertRowid), 
        content: finalContent, 
        user_id: req.user.id, 
        media_url, 
        media_type 
      });
    } catch (error: any) {
      console.error('Post creation error:', error);
      res.status(500).json({ error: 'Database error: ' + error.message });
    }
  });

  apiRouter.delete('/posts/:id', authenticateToken, (req: any, res) => {
    try {
      const postId = Number(req.params.id);
      const userId = Number(req.user.id);
      
      if (isNaN(postId) || isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      if (post.user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized: You are not the author of this post' });
      }

      const deleteLikes = db.prepare('DELETE FROM likes WHERE post_id = ?');
      const deleteComments = db.prepare('DELETE FROM comments WHERE post_id = ?');
      const deleteReports = db.prepare('DELETE FROM reports WHERE post_id = ?');
      const deletePost = db.prepare('DELETE FROM posts WHERE id = ?');

      const transaction = db.transaction(() => {
        deleteLikes.run(postId);
        deleteComments.run(postId);
        deleteReports.run(postId);
        deletePost.run(postId);
      });

      transaction();
      
      res.json({ message: 'Post deleted successfully' });
    } catch (error: any) {
      console.error('Delete post error:', error);
      res.status(500).json({ error: 'Failed to delete post: ' + error.message });
    }
  });

  apiRouter.put('/posts/:id', authenticateToken, (req: any, res) => {
    try {
      const { content } = req.body;
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Content is required' });
      }
      if (content.length > 500) {
        return res.status(400).json({ error: 'Content too long' });
      }

      const postId = Number(req.params.id);
      const userId = Number(req.user.id);

      const stmt = db.prepare('UPDATE posts SET content = ? WHERE id = ? AND user_id = ?');
      const result = stmt.run(content, postId, userId);
      
      if (result.changes === 0) {
        return res.status(403).json({ error: 'Unauthorized or not found' });
      }
      
      res.json({ message: 'Post updated', content });
    } catch (error: any) {
      res.status(500).json({ error: 'Database error: ' + error.message });
    }
  });

  // --- Interaction Routes ---
  apiRouter.post('/posts/:id/like', authenticateToken, (req: any, res) => {
    try {
      db.prepare('INSERT INTO likes (user_id, post_id) VALUES (?, ?)').run(req.user.id, req.params.id);
      res.json({ liked: true });
    } catch (err) {
      db.prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?').run(req.user.id, req.params.id);
      res.json({ liked: false });
    }
  });

  apiRouter.get('/posts/:id/comments', authenticateToken, (req, res) => {
    try {
      const comments = db.prepare(`
        SELECT c.*, u.name as author_name, u.startup_name
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC
      `).all(req.params.id);
      res.json(comments);
    } catch (error: any) {
      console.error('Fetch comments error:', error);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  });

  apiRouter.post('/posts/:id/comments', authenticateToken, (req: any, res) => {
    try {
      const { content, parent_id } = req.body;
      const stmt = db.prepare('INSERT INTO comments (user_id, post_id, content, parent_id) VALUES (?, ?, ?, ?)');
      const result = stmt.run(req.user.id, req.params.id, content, parent_id || null);
      res.json({ id: Number(result.lastInsertRowid), content, parent_id });
    } catch (error: any) {
      console.error('Create comment error:', error);
      res.status(500).json({ error: 'Failed to create comment' });
    }
  });

  apiRouter.post('/posts/:id/report', authenticateToken, (req: any, res) => {
    try {
      const { reason } = req.body;
      db.prepare('INSERT INTO reports (user_id, post_id, reason) VALUES (?, ?, ?)').run(req.user.id, req.params.id, reason);
      res.json({ message: 'Reported' });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to report' });
    }
  });

  // --- Profile Routes ---
  apiRouter.put('/profile', authenticateToken, upload.single('avatar'), (req: any, res) => {
    try {
      const { name, startup_name, role, bio, website, location } = req.body;
      let profile_picture = req.body.profile_picture;
      
      if (req.file) {
        profile_picture = `/uploads/${req.file.filename}`;
      }

      const stmt = db.prepare(`
        UPDATE users 
        SET name = ?, startup_name = ?, role = ?, bio = ?, website = ?, location = ?, profile_picture = ?
        WHERE id = ?
      `);
      stmt.run(name, startup_name, role, bio, website, location, profile_picture, req.user.id);
      res.json({ message: 'Profile updated', profile_picture });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  apiRouter.get('/users/suggested', authenticateToken, (req: any, res) => {
    try {
      const users = db.prepare(`
        SELECT id, name, startup_name, role, profile_picture
        FROM users 
        WHERE id != ? 
        AND id NOT IN (SELECT target_id FROM co_builders WHERE user_id = ?)
        ORDER BY RANDOM()
        LIMIT 5
      `).all(req.user.id, req.user.id);
      res.json(users);
    } catch (error: any) {
      console.error('Fetch suggested users error:', error);
      res.status(500).json({ error: 'Failed to fetch suggestions' });
    }
  });

  apiRouter.get('/users/:id', authenticateToken, (req: any, res) => {
    try {
      const user: any = db.prepare(`
        SELECT id, name, startup_name, role, bio, website, profile_picture, location,
        (SELECT COUNT(*) FROM co_builders WHERE target_id = users.id) as co_builders_count,
        (SELECT COUNT(*) FROM co_builders WHERE user_id = users.id) as co_building_count,
        (SELECT 1 FROM co_builders WHERE user_id = ? AND target_id = users.id) as is_co_building
        FROM users WHERE id = ?
      `).get(req.user.id, req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  apiRouter.post('/users/:id/co-build', authenticateToken, (req: any, res) => {
    try {
      const targetId = req.params.id;
      if (req.user.id == targetId) return res.status(400).json({ error: "You cannot co-build with yourself" });
      
      db.prepare('INSERT INTO co_builders (user_id, target_id) VALUES (?, ?)').run(req.user.id, targetId);
      res.json({ co_building: true });
    } catch (err) {
      db.prepare('DELETE FROM co_builders WHERE user_id = ? AND target_id = ?').run(req.user.id, req.params.id);
      res.json({ co_building: false });
    }
  });

  // --- Product (Launch) Routes ---
  apiRouter.get('/products', authenticateToken, (req: any, res) => {
    try {
      const products = db.prepare(`
        SELECT p.*, u.name as founder_name, u.profile_picture as founder_avatar,
        (SELECT COUNT(*) FROM product_likes WHERE product_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM product_comments WHERE product_id = p.id) as comments_count,
        (SELECT 1 FROM product_likes WHERE product_id = p.id AND user_id = ?) as is_liked
        FROM products p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
      `).all(req.user.id);
      res.json(products);
    } catch (error: any) {
      console.error('Fetch products error:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  apiRouter.post('/products', authenticateToken, upload.single('image'), (req: any, res) => {
    try {
      const { name, problem_solved, website, short_description } = req.body;
      const image_url = req.file ? `/uploads/${req.file.filename}` : null;

      if (!name || !problem_solved || !website || !short_description) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const stmt = db.prepare(`
        INSERT INTO products (user_id, name, problem_solved, website, short_description, image_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(req.user.id, name, problem_solved, website, short_description, image_url);

      res.json({ id: Number(result.lastInsertRowid), name, problem_solved, website, short_description, image_url });
    } catch (error: any) {
      console.error('Product creation error:', error);
      res.status(500).json({ error: 'Failed to launch product' });
    }
  });

  apiRouter.post('/products/:id/like', authenticateToken, (req: any, res) => {
    try {
      const productId = req.params.id;
      const userId = req.user.id;
      try {
        db.prepare('INSERT INTO product_likes (user_id, product_id) VALUES (?, ?)').run(userId, productId);
        res.json({ liked: true });
      } catch (err) {
        db.prepare('DELETE FROM product_likes WHERE user_id = ? AND product_id = ?').run(userId, productId);
        res.json({ liked: false });
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to toggle like' });
    }
  });

  apiRouter.get('/products/:id/comments', authenticateToken, (req, res) => {
    try {
      const comments = db.prepare(`
        SELECT c.*, u.name as author_name, u.profile_picture as author_avatar
        FROM product_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.product_id = ?
        ORDER BY c.created_at ASC
      `).all(req.params.id);
      res.json(comments);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  });

  apiRouter.post('/products/:id/comments', authenticateToken, (req: any, res) => {
    try {
      const { content, parent_id } = req.body;
      const stmt = db.prepare('INSERT INTO product_comments (user_id, product_id, content, parent_id) VALUES (?, ?, ?, ?)');
      const result = stmt.run(req.user.id, req.params.id, content, parent_id || null);
      res.json({ id: Number(result.lastInsertRowid), content, parent_id });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to add comment' });
    }
  });

  apiRouter.delete('/products/:id/comments/:commentId', authenticateToken, (req: any, res) => {
    try {
      const { commentId } = req.params;
      const stmt = db.prepare('DELETE FROM product_comments WHERE id = ? AND user_id = ?');
      const result = stmt.run(commentId, req.user.id);
      if (result.changes === 0) return res.status(403).json({ error: 'Unauthorized' });
      res.json({ message: 'Comment deleted' });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  });

  // --- Messaging Routes ---
  apiRouter.get('/conversations', authenticateToken, (req: any, res) => {
    try {
      const convs = db.prepare(`
        SELECT c.*, u.name as other_name, u.profile_picture as other_avatar,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = 0) as unread_count
        FROM conversations c
        JOIN users u ON (u.id = c.user1_id OR u.id = c.user2_id) AND u.id != ?
        WHERE c.user1_id = ? OR c.user2_id = ?
        ORDER BY (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) DESC
      `).all(req.user.id, req.user.id, req.user.id, req.user.id);
      res.json(convs);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  });

  apiRouter.post('/conversations', authenticateToken, (req: any, res) => {
    const { other_id } = req.body;
    if (!other_id) return res.status(400).json({ error: 'Other user ID is required' });
    
    const user1 = Math.min(req.user.id, Number(other_id));
    const user2 = Math.max(req.user.id, Number(other_id));
    
    try {
      const result = db.prepare('INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)').run(user1, user2);
      res.json({ id: Number(result.lastInsertRowid) });
    } catch (err) {
      const existing: any = db.prepare('SELECT id FROM conversations WHERE user1_id = ? AND user2_id = ?').get(user1, user2);
      res.json(existing || { error: 'Failed to create or find conversation' });
    }
  });

  apiRouter.get('/conversations/:id/messages', authenticateToken, (req: any, res) => {
    try {
      const messages = db.prepare(`
        SELECT * FROM messages 
        WHERE conversation_id = ? 
        ORDER BY created_at ASC
      `).all(req.params.id);
      
      db.prepare('UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?').run(req.params.id, req.user.id);
      
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });
  // ✅ Send message (creates conversation if needed)
apiRouter.post('/messages', authenticateToken, (req: any, res) => {
  try {
    const sender_id = Number(req.user.id);
    const { receiver_id, content } = req.body;

    if (!receiver_id || !content || !String(content).trim()) {
      return res.status(400).json({ error: 'receiver_id and content are required' });
    }

    const rid = Number(receiver_id);
    if (rid === sender_id) {
      return res.status(400).json({ error: "You can't message yourself" });
    }

    // 1) find or create conversation
    const user1 = Math.min(sender_id, rid);
    const user2 = Math.max(sender_id, rid);

    let conv: any = db
      .prepare('SELECT id FROM conversations WHERE user1_id = ? AND user2_id = ?')
      .get(user1, user2);

    if (!conv) {
      const created = db
        .prepare('INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)')
        .run(user1, user2);
      conv = { id: Number(created.lastInsertRowid) };
    }

    // 2) insert message
    const result = db
      .prepare('INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)')
      .run(conv.id, sender_id, content.trim());

    const message = {
      id: Number(result.lastInsertRowid),
      conversation_id: conv.id,
      sender_id,
      content: content.trim(),
      is_read: 0,
      created_at: new Date().toISOString(),
    };

   io.to(`user_${rid}`).emit('receive_message', message);

    res.json({ success: true, conversation_id: conv.id, message });
  } catch (error: any) {
    console.error('POST /api/messages error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

  apiRouter.get('/admin/reports', authenticateToken, (req: any, res) => {
  const user: any = db.prepare("SELECT role FROM users WHERE id = ?")
    .get(req.user.id);

  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access only' });
  }

  const reports = db.prepare(`
    SELECT r.*, p.content as post_content, u.name as reporter_name
    FROM reports r
    JOIN posts p ON r.post_id = p.id
    JOIN users u ON r.user_id = u.id
    ORDER BY r.created_at DESC
  `).all();

  res.json(reports);
});
  
// =======================
// =======================
// Q&A Routes
// =======================

// ✅ Create Question
apiRouter.post('/questions', authenticateToken, (req: any, res) => {
  const { title, description } = req.body;

  if (!title || !description)
    return res.status(400).json({ error: "Title & description required" });

  const result = db.prepare(`
    INSERT INTO questions (user_id, title, description)
    VALUES (?, ?, ?)
  `).run(req.user.id, title, description);

  res.json({ id: Number(result.lastInsertRowid) });
});

// ✅ Get All Questions
apiRouter.get('/questions', authenticateToken, (req: any, res) => {
  const questions = db.prepare(`
    SELECT 
      q.*, 
      u.name as author_name,
      (SELECT COUNT(*) FROM answers WHERE question_id = q.id) as answers_count
    FROM questions q
    JOIN users u ON q.user_id = u.id
    ORDER BY q.created_at DESC
  `).all();

  res.json(questions);
});

// ✅ Get Single Question
apiRouter.get('/questions/:id', authenticateToken, (req: any, res) => {

  const question = db.prepare(`
    SELECT q.*, u.name as author_name
    FROM questions q
    JOIN users u ON q.user_id = u.id
    WHERE q.id = ?
  `).get(req.params.id);

  if (!question)
    return res.status(404).json({ error: "Question not found" });

  const answers = db.prepare(`
    SELECT a.*, u.name as author_name
    FROM answers a
    JOIN users u ON a.user_id = u.id
    WHERE a.question_id = ?
    ORDER BY a.is_best DESC, a.created_at ASC
  `).all(req.params.id);

  res.json({ question, answers });
});

// ✅ Post Answer
apiRouter.post('/questions/:id/answers', authenticateToken, (req: any, res) => {
  const { content } = req.body;

  if (!content || !content.trim())
    return res.status(400).json({ error: "Answer required" });

  const result = db.prepare(`
    INSERT INTO answers (question_id, user_id, content)
    VALUES (?, ?, ?)
  `).run(req.params.id, req.user.id, content);

  const user: any = db.prepare(
  "SELECT name FROM users WHERE id = ?"
).get(req.user.id);

res.json({
  id: Number(result.lastInsertRowid),
  content,
  user_id: req.user.id,
  author_name: user?.name || "Unknown"
});
});

// ✅ Mark Best Answer
apiRouter.put('/answers/:id/best', authenticateToken, (req: any, res) => {

  const answer: any = db.prepare(`
    SELECT a.*, q.user_id as question_owner
    FROM answers a
    JOIN questions q ON a.question_id = q.id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!answer || answer.question_owner !== req.user.id)
    return res.status(403).json({ error: "Not allowed" });

  db.prepare(`
    UPDATE answers SET is_best = 0 WHERE question_id = ?
  `).run(answer.question_id);

  db.prepare(`
    UPDATE answers SET is_best = 1 WHERE id = ?
  `).run(req.params.id);

  res.json({ success: true });
});

// ✅ Delete Question (MUST BE OUTSIDE)
apiRouter.delete('/questions/:id', authenticateToken, (req: any, res) => {
  const question: any = db.prepare(`
    SELECT * FROM questions WHERE id = ?
  `).get(req.params.id);

  if (!question || question.user_id !== req.user.id)
    return res.status(403).json({ error: "Not allowed" });

  db.prepare(`DELETE FROM questions WHERE id = ?`).run(req.params.id);

  res.json({ deleted: true });
});

// ✅ Delete Answer (MUST BE OUTSIDE)
apiRouter.delete('/answers/:id', authenticateToken, (req: any, res) => {
  const answer: any = db.prepare(`
    SELECT * FROM answers WHERE id = ?
  `).get(req.params.id);

  if (!answer || Number(answer.user_id) !== Number(req.user.id))
    return res.status(403).json({ error: "Not allowed" });

  db.prepare(`DELETE FROM answers WHERE id = ?`).run(req.params.id);

  res.json({ deleted: true });
});
// ✅ Update Answer
apiRouter.put('/answers/:id', authenticateToken, (req: any, res) => {
  const { content } = req.body;

  const answer: any = db.prepare(`
    SELECT * FROM answers WHERE id = ?
  `).get(req.params.id);

  if (!answer || Number(answer.user_id) !== Number(req.user.id))
    return res.status(403).json({ error: "Not allowed" });

  db.prepare(`
    UPDATE answers SET content = ? WHERE id = ?
  `).run(content, req.params.id);

  res.json({ updated: true });
});
// =======================
// Investor Requests Routes
// =======================

// ✅ Create Investor Request
apiRouter.post('/investor-requests', authenticateToken, (req: any, res) => {
  try {
    const {
      startup_name,
      website_url,
      launched_date,
      monthly_revenue,
      users_count,
      amount_raising,
      pitch,
    } = req.body;

    // basic validation
    if (!startup_name?.trim() || !launched_date?.trim() || !pitch?.trim()) {
      return res
        .status(400)
        .json({ error: "Startup name, launch date, and pitch required" });
    }

    const usersNum = Number(users_count);
    const raiseNum = Number(amount_raising);

    if (isNaN(usersNum) || isNaN(raiseNum)) {
      return res.status(400).json({ error: "Users & Funding must be numbers" });
    }

    // NOTE: DB check should match your table constraint (60 বা 600 যেটা রাখছ)
    if (String(pitch).trim().length > 600) {
      return res
        .status(400)
        .json({ error: "Pitch must be within 600 characters" });
    }

    const result = db
      .prepare(
        `
      INSERT INTO investor_requests (
        user_id, startup_name, website_url, launched_date,
        monthly_revenue, users_count, amount_raising, pitch
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        req.user.id,
        String(startup_name).trim(),
        website_url ? String(website_url).trim() : null,
        String(launched_date).trim(),
        monthly_revenue ? String(monthly_revenue).trim() : null,
        usersNum,
        raiseNum,
        String(pitch).trim()
      );

    res.json({ id: Number(result.lastInsertRowid) });
  } catch (e: any) {
    console.error("POST /investor-requests error:", e);
    res.status(500).json({ error: "Failed to create request" });
  }
});

// ✅ Get All Investor Requests
apiRouter.get('/investor-requests', authenticateToken, (req: any, res) => {
  try {
    const rows = db
      .prepare(
        `
      SELECT 
        r.*,
        u.name as founder_name,
        u.startup_name as founder_startup,
        u.role as founder_role,
        u.profile_picture as founder_avatar
      FROM investor_requests r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `
      )
      .all();

    res.json(rows);
  } catch (e: any) {
    console.error("GET /investor-requests error:", e);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// ✅ Get Single Investor Request
apiRouter.get('/investor-requests/:id', authenticateToken, (req: any, res) => {
  try {
    const row: any = db
      .prepare(
        `
      SELECT 
        r.*,
        u.name as founder_name,
        u.startup_name as founder_startup,
        u.role as founder_role,
        u.profile_picture as founder_avatar
      FROM investor_requests r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `
      )
      .get(req.params.id);

    if (!row) return res.status(404).json({ error: "Request not found" });

    res.json(row);
  } catch (e: any) {
    console.error("GET /investor-requests/:id error:", e);
    res.status(500).json({ error: "Failed to fetch request" });
  }
});

// ✅ Update Investor Request (Only Owner)
apiRouter.put('/investor-requests/:id', authenticateToken, (req: any, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    // owner check
    const existing: any = db
      .prepare(`SELECT id, user_id FROM investor_requests WHERE id = ?`)
      .get(id);

    if (!existing) return res.status(404).json({ error: "Request not found" });
    if (Number(existing.user_id) !== Number(req.user.id))
      return res.status(403).json({ error: "Not allowed" });

    const {
      startup_name,
      website_url,
      launched_date,
      monthly_revenue,
      users_count,
      amount_raising,
      pitch,
    } = req.body;

    if (!startup_name?.trim() || !launched_date?.trim() || !pitch?.trim()) {
      return res
        .status(400)
        .json({ error: "Startup name, launch date, and pitch required" });
    }

    const usersNum = Number(users_count);
    const raiseNum = Number(amount_raising);

    if (isNaN(usersNum) || isNaN(raiseNum)) {
      return res.status(400).json({ error: "Users & Funding must be numbers" });
    }

    if (String(pitch).trim().length > 600) {
      return res
        .status(400)
        .json({ error: "Pitch must be within 600 characters" });
    }

    const result = db
      .prepare(
        `
      UPDATE investor_requests
      SET startup_name = ?, website_url = ?, launched_date = ?,
          monthly_revenue = ?, users_count = ?, amount_raising = ?, pitch = ?
      WHERE id = ? AND user_id = ?
    `
      )
      .run(
        String(startup_name).trim(),
        website_url ? String(website_url).trim() : null,
        String(launched_date).trim(),
        monthly_revenue ? String(monthly_revenue).trim() : null,
        usersNum,
        raiseNum,
        String(pitch).trim(),
        id,
        req.user.id
      );

    if (result.changes === 0)
      return res.status(403).json({ error: "Not allowed" });

    res.json({ updated: true });
  } catch (e: any) {
    console.error("PUT /investor-requests/:id error:", e);
    res.status(500).json({ error: "Failed to update request" });
  }
});

// ✅ Delete Investor Request (Only Owner)
apiRouter.delete('/investor-requests/:id', authenticateToken, (req: any, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const row: any = db
      .prepare(`SELECT id, user_id FROM investor_requests WHERE id = ?`)
      .get(id);

    if (!row) return res.status(404).json({ error: "Request not found" });
    if (Number(row.user_id) !== Number(req.user.id))
      return res.status(403).json({ error: "Not allowed" });

    db.prepare(`DELETE FROM investor_requests WHERE id = ?`).run(id);
    res.json({ deleted: true });
  } catch (e: any) {
    console.error("DELETE /investor-requests/:id error:", e);
    res.status(500).json({ error: "Failed to delete request" });
  }
});
// =======================
// Partner Requests Routes
// =======================

// CREATE
apiRouter.post("/partner-requests", authenticateToken, (req: any, res) => {
  try {
    const { startup_name, website_url, monthly_revenue, needed_role, description } = req.body;

    if (!startup_name || !needed_role || !description) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    if (description.length > 600) {
      return res.status(400).json({ error: "Description too long" });
    }

    const result = db.prepare(`
      INSERT INTO partner_requests
      (user_id, startup_name, website_url, monthly_revenue, needed_role, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      startup_name,
      website_url || null,
      monthly_revenue || null,
      needed_role,
      description
    );

    res.json({ id: result.lastInsertRowid });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create request" });
  }
});


// GET ALL
apiRouter.get("/partner-requests", authenticateToken, (req: any, res) => {
  try {
    const rows = db.prepare(`
      SELECT p.*, u.name as founder_name, u.profile_picture as founder_avatar
      FROM partner_requests p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.id DESC
    `).all();

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});


// DELETE (owner only)
apiRouter.delete("/partner-requests/:id", authenticateToken, (req: any, res) => {
  try {
    const request = db.prepare("SELECT * FROM partner_requests WHERE id = ?")
      .get(req.params.id);

    if (!request) return res.status(404).json({ error: "Not found" });

    if (request.user_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    db.prepare("DELETE FROM partner_requests WHERE id = ?")
      .run(req.params.id);

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Delete failed" });
  }
});

 // --- Search Route ---
apiRouter.get('/search', authenticateToken, (req: any, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json({ founders: [], posts: [], products: [] });

    const like = `%${q}%`;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    // Founders
    const founders = db.prepare(`
  SELECT id, name, startup_name, role, bio, website, profile_picture, location
  FROM users
  WHERE 
    LOWER(name) LIKE LOWER(?) OR
    LOWER(startup_name) LIKE LOWER(?) OR
    LOWER(role) LIKE LOWER(?) OR
    LOWER(bio) LIKE LOWER(?)
  ORDER BY created_at DESC
  LIMIT ?
`).all(like, like, like, like, limit);

    // ✅ Posts (UPDATED PART)
    const posts = db.prepare(`
      SELECT p.*, u.name as author_name, u.startup_name, u.role, u.profile_picture as author_avatar,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
        (SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked,
        (SELECT 1 FROM co_builders WHERE user_id = ? AND target_id = p.user_id) as is_co_building
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE 
  LOWER(p.content) LIKE LOWER(?)
  OR LOWER(u.name) LIKE LOWER(?)
  OR LOWER(u.startup_name) LIKE LOWER(?)
      ORDER BY p.created_at DESC
      LIMIT ?
    `).all(req.user.id, req.user.id, like, like, like, limit);

    // Products
    const products = db.prepare(`
      SELECT p.*, u.name as founder_name, u.profile_picture as founder_avatar,
        (SELECT COUNT(*) FROM product_likes WHERE product_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM product_comments WHERE product_id = p.id) as comments_count,
        (SELECT 1 FROM product_likes WHERE product_id = p.id AND user_id = ?) as is_liked
      FROM products p
      JOIN users u ON p.user_id = u.id
      WHERE p.name LIKE ? OR p.short_description LIKE ? OR p.problem_solved LIKE ?
      ORDER BY p.created_at DESC
      LIMIT ?
    `).all(req.user.id, like, like, like, limit);

    res.json({ founders, posts, products });

  } catch (error: any) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search' });
  }
});
  // Mount API Router
  app.use('/api', apiRouter);

  // Catch-all for API routes that don't match
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
  });

  // --- Socket.io ---
  io.on('connection', (socket) => {
    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
    });

    socket.on('send_message', (data) => {
      const { conversation_id, sender_id, receiver_id, content } = data;
      const stmt = db.prepare('INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)');
      const result = stmt.run(conversation_id, sender_id, content);
      
      const message = {
        id: Number(result.lastInsertRowid),
        conversation_id,
        sender_id,
        content,
        created_at: new Date().toISOString()
      };

      io.to(`user_${receiver_id}`).emit('receive_message', message);
      socket.emit('message_sent', message);
    });
  });

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
