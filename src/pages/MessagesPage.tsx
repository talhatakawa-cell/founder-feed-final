import { useState, useEffect, useRef } from 'react';
import { User, Conversation, Message } from '../types';
import { Socket } from 'socket.io-client';
import { Send, ChevronLeft, Search, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MessagesPage({
  currentUser,
  setUnreadCount,
  socket,
}: {
  currentUser: User;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  socket: Socket | null;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset unread badge when page opens
  useEffect(() => {
    setUnreadCount(0);
  }, [setUnreadCount]);

  // Socket listener
  useEffect(() => {
    if (!socket) return;

    const handleReceive = (message: Message) => {
      if (activeConv && message.conversation_id === activeConv.id) {
        setMessages(prev => [...prev, message]);
      } else {
        fetchConversations();
      }
    };

    socket.on('receive_message', handleReceive);

    return () => {
      socket.off('receive_message', handleReceive);
    };
  }, [socket, activeConv]);

  // Load conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConv) {
      fetchMessages(activeConv.id);
    }
  }, [activeConv]);

  // Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: number) => {
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv || !socket) return;

    const receiverId =
      activeConv.user1_id === currentUser.id
        ? activeConv.user2_id
        : activeConv.user1_id;

    socket.emit('send_message', {
      conversation_id: activeConv.id,
      sender_id: currentUser.id,
      receiver_id: receiverId,
      content: newMessage,
    });

    setNewMessage('');
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.other_name
      ?.toLowerCase()
      .trim()
      .includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-80px)] flex bg-white dark:bg-zinc-950 border-x border-zinc-200 dark:border-zinc-800">
      
      {/* Sidebar */}
      <div className={`w-full md:w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col ${activeConv ? 'hidden md:flex' : 'flex'}`}>
        
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-xl font-bold mb-4">Messages</h1>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search founders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-xl pl-10 pr-4 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              Loading chats...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm italic">
              {searchTerm.trim()
                ? 'No matching conversations.'
                : 'No conversations yet.'}
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConv(conv)}
                className={`w-full p-4 flex gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-900 ${
                  activeConv?.id === conv.id
                    ? 'bg-zinc-100 dark:bg-zinc-900'
                    : ''
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex items-center justify-center">
                  {conv.other_avatar ? (
                    <img
                      src={conv.other_avatar}
                      alt={conv.other_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold">
                      {conv.other_name?.[0] || '?'}
                    </div>
                  )}
                </div>

                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-sm truncate">
                      {conv.other_name}
                    </span>

                    {conv.unread_count > 0 && (
                      <span className="bg-emerald-500 text-zinc-950 text-[10px] px-1.5 py-0.5 rounded-full">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-500 truncate">
                    {conv.last_message || 'No messages yet'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!activeConv ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {activeConv ? (
          <>
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveConv(null)}
                  className="md:hidden"
                >
                  <ChevronLeft />
                </button>
                <h2 className="font-bold text-sm">
                  {activeConv.other_name}
                </h2>
              </div>

              <Link
                to={`/profile/${
                  activeConv.user1_id === currentUser.id
                    ? activeConv.user2_id
                    : activeConv.user1_id
                }`}
              >
                <ExternalLink className="w-5 h-5" />
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isMine = msg.sender_id === currentUser.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${
                      isMine ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                        isMine
                          ? 'bg-emerald-500 text-zinc-950'
                          : 'bg-white dark:bg-zinc-900 border'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex gap-2">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl px-4 py-3 text-sm"
                  placeholder="Type a message..."
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-emerald-500 px-4 py-2 rounded-xl"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center text-zinc-500">
            Select a conversation to start chatting.
          </div>
        )}
      </div>
    </div>
  );
}