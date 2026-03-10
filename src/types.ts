export interface User {
  id: number;
  email: string;
  name: string;
  startup_name: string;
  role: string;
  bio?: string;
  website?: string;
  profile_picture?: string;
  location?: string;
  is_verified?: number;
  co_builders_count?: number;
  co_building_count?: number;
  is_co_building?: number;
}

export interface Post {
  id: number;
  user_id: number;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  created_at: string;
  author_name: string;
  author_avatar?: string;
  startup_name: string;
  role: string;
  likes_count: number;
  comments_count: number;
  is_liked: number;
  is_co_building: number;
}

export interface Conversation {
  id: number;
  user1_id: number;
  user2_id: number;
  other_name: string;
  other_avatar?: string;
  last_message?: string;
  unread_count: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  is_read: number;
  created_at: string;
}

export interface Comment {
  id: number;
  user_id: number;
  post_id: number;
  parent_id?: number;
  content: string;
  created_at: string;
  author_name: string;
  startup_name: string;
}

export interface Product {
  id: number;
  user_id: number;
  name: string;
  problem_solved: string;
  website: string;
  short_description: string;
  image_url?: string;
  created_at: string;
  founder_name: string;
  founder_avatar?: string;
  likes_count: number;
  comments_count: number;
  is_liked: number;
}

export interface ProductComment {
  id: number;
  user_id: number;
  product_id: number;
  parent_id?: number;
  content: string;
  created_at: string;
  author_name: string;
  author_avatar?: string;
}
