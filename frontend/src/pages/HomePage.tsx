import { useState, useRef, useEffect, useCallback } from "react";
import { 
  Lock, 
  Menu, 
  Plus, 
  Send, 
  MessageSquare, 
  Sparkles,
  Settings,
  User,
  LogOut
} from "lucide-react";
import './HomePage.css';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { 
  getUserChats, 
  getChat, 
  saveChatMessages, 
  getUserProfile,
  type Chat,
  type ChatMessage
} from '../utils/firestore';
import { signOutUser } from '../utils/firebaseAuth';

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

// Custom CSS for scrollbars
const CustomScrollbarStyles = () => (
  <style>{`
    .sidebar-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .sidebar-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .sidebar-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
    }
    .sidebar-scrollbar:hover::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
    }
    
    .main-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .main-scrollbar::-webkit-scrollbar-track {
      background: #f1f5f9; /* bg-gray-100 */
    }
    .main-scrollbar::-webkit-scrollbar-thumb {
      background: #cbd5e1; /* bg-gray-300 */
      border-radius: 3px;
    }
    .main-scrollbar:hover::-webkit-scrollbar-thumb {
      background: #94a3b8; /* bg-gray-400 */
    }
  `}</style>
);


export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<{ fullName: string; email: string } | null>(null);
  const [recentChats, setRecentChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Format time for display
  const formatTime = (date: Date | any): string => {
    if (!date) return '';
    const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return d.toLocaleDateString();
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load user profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Load user profile
        const { data: profile } = await getUserProfile(user.uid);
        if (profile) {
          setUserProfile({ fullName: profile.fullName, email: profile.email });
        } else {
          setUserProfile({ fullName: user.displayName || 'User', email: user.email || '' });
        }
        // Load chats
        const { chats, error } = await getUserChats(user.uid);
        if (!error && chats) {
          setRecentChats(chats);
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load chats from Firebase
  const loadChats = useCallback(async (userId: string) => {
    const { chats, error } = await getUserChats(userId);
    if (!error && chats) {
      setRecentChats(chats);
    }
  }, []);

  // Load a specific chat
  const loadChat = useCallback(async (chatId: string) => {
    if (!currentUser) return;
    
    setIsLoading(true);
    const { chat, error } = await getChat(currentUser.uid, chatId);
    if (!error && chat) {
      setCurrentChatId(chat.id);
      setMessages(chat.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp : (msg.timestamp as any).toDate ? (msg.timestamp as any).toDate() : new Date()
      })));
      setIsSidebarOpen(false); // Close sidebar on mobile
    }
    setIsLoading(false);
  }, [currentUser]);

  // Save messages to Firebase
  const saveMessages = useCallback(async (chatId: string | null, msgs: Message[]) => {
    if (!currentUser || msgs.length === 0) return;
    
    setIsSaving(true);
    try {
      const chatMessages: ChatMessage[] = msgs.map(msg => ({
        id: msg.id,
        text: msg.text,
        sender: msg.sender,
        timestamp: msg.timestamp
      }));
      
      const { chatId: savedChatId, error } = await saveChatMessages(
        currentUser.uid,
        chatId,
        chatMessages
      );
      
      if (!error && savedChatId) {
        setCurrentChatId(savedChatId);
        // Reload chats to update the list
        await loadChats(currentUser.uid);
      }
    } catch (error) {
      console.error('Error saving messages:', error);
    } finally {
      setIsSaving(false);
    }
  }, [currentUser, loadChats]);

  // Save on tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (messages.length > 0 && currentUser) {
        // Save messages before page unload
        saveMessages(currentChatId, messages);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [messages, currentChatId, currentUser, saveMessages]);

  // Auto-save messages periodically
  useEffect(() => {
    if (messages.length > 0 && currentUser && !isSaving) {
      const timer = setTimeout(() => {
        saveMessages(currentChatId, messages);
      }, 5000); // Save every 5 seconds

      return () => clearTimeout(timer);
    }
  }, [messages, currentChatId, currentUser, isSaving, saveMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentUser) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: "user",
      timestamp: new Date()
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Save user message immediately
    await saveMessages(currentChatId, updatedMessages);

    // Simulate AI response (replace with actual AI API call later)
    try {
  const response = await fetch("http://localhost:5000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: currentUser.uid,
      message: userMessage.text
    })
  });

  const data = await response.json();

  const aiMessage: Message = {
    id: Date.now().toString(),
    text: data.reply,
    sender: "ai",
    timestamp: new Date()
  };

  const finalMessages = [...updatedMessages, aiMessage];
  setMessages(finalMessages);
  saveMessages(currentChatId, finalMessages);

} catch (error) {
  console.error("API Error:", error);
}

  };

  const handleNewChat = async () => {
    if (!currentUser) return;
    
    setMessages([]);
    setCurrentChatId(null);
    setInputValue("");
    setIsSidebarOpen(false);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleSignOut = async () => {
    if (!currentUser) return;
    
    // Save any unsaved messages before signing out
    if (messages.length > 0) {
      await saveMessages(currentChatId, messages);
    }
    
    const { error } = await signOutUser();
    if (error) {
      console.error('Error signing out:', error);
      // Still sign out even if there's an error
    }
    
    // The auth state change will handle navigation via App.tsx
  };

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${e.target.scrollHeight}px`;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="homepage-container">
      <CustomScrollbarStyles />
      {/* Sidebar */}
      <div 
        className={`homepage-sidebar ${isSidebarOpen ? 'open' : ''}`}
      >
        <div className="homepage-sidebar-content">
          {/* Logo */}
          <div className="homepage-logo">
            <div className="homepage-logo-icon">
              <Lock />
            </div>
            <h1 className="homepage-logo-text">Toyota NextAI</h1>
          </div>

          {/* New Chat Button */}
          <button 
            className="homepage-new-chat-button"
            onClick={handleNewChat}
          >
            <Plus />
            New Chat
          </button>

          {/* Recent Chats */}
          <div className="homepage-recent-chats homepage-sidebar-scrollbar">
            <p className="homepage-recent-chats-label">Recent Chats</p>
            {isLoading ? (
              <div className="homepage-loading-chats">
                <p className="homepage-loading-text">Loading chats...</p>
              </div>
            ) : recentChats.length === 0 ? (
              <div className="homepage-no-chats">
                <p className="homepage-no-chats-text">No chats yet. Start a new conversation!</p>
              </div>
            ) : (
              <div className="homepage-chat-list">
                {recentChats.map((chat) => (
                  <button
                    key={chat.id}
                    className={`homepage-chat-item ${currentChatId === chat.id ? 'active' : ''}`}
                    onClick={() => loadChat(chat.id)}
                  >
                    <div className="homepage-chat-item-content">
                      <MessageSquare className="homepage-chat-item-icon" />
                      <div className="homepage-chat-item-text">
                        <p className="homepage-chat-title">{chat.title}</p>
                        <p className="homepage-chat-time">{formatTime(chat.updatedAt)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="homepage-user-profile">
            <button className="homepage-user-button">
              <div className="homepage-user-avatar">
                <User />
              </div>
              <div className="homepage-user-info">
                <p className="homepage-user-name">{userProfile?.fullName || 'User'}</p>
                <p className="homepage-user-email">{userProfile?.email || ''}</p>
              </div>
              <Settings className="homepage-user-settings" />
            </button>
            <button 
              className="homepage-signout-button"
              onClick={handleSignOut}
              title="Sign Out"
            >
              <LogOut className="homepage-signout-icon" />
              <span className="homepage-signout-text">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="homepage-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="homepage-main-content">
        {/* Header */}
        <header className="homepage-header">
          <div className="homepage-header-left">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="homepage-menu-button"
            >
              <Menu />
            </button>
            <h2 className="homepage-header-title">
              Recommendations Assistant
            </h2>
          </div>
        </header>

        {/* Chat Area */}
        <div className="homepage-chat-area homepage-chat-scrollbar">
          {messages.length === 0 ? (
            // Welcome Screen
            <div className="homepage-welcome">
              <div className="homepage-welcome-content">
                <div className="homepage-welcome-header">
                  <div className="homepage-welcome-icon">
                    <Sparkles />    
                  </div>
                  <h1 className="homepage-welcome-title">How can I help you today?</h1>
                  <p className="homepage-welcome-subtitle">
                    Your AI-powered car recommendations assistant ready to help you find the perfect car
                  </p>
                </div>

                {/* Info Banner */}
                <div className="homepage-info-banner">
                  <p className="homepage-info-banner-text">
                    <strong>💡 Tip:</strong> Ask me anything about car recommendations and how your financial background can help you find the perfect car. I'm here to provide personalized guidance!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Chat Messages
            <div className="homepage-messages-container">
              <div className="homepage-messages-list">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`homepage-message ${message.sender}`}
                  >
                    {message.sender === "ai" && (
                      <div className="homepage-message-avatar ai">
                        <Sparkles />
                      </div>
                    )}
                    <div className={`homepage-message-bubble ${message.sender}`}>
                      <p className="homepage-message-text">{message.text}</p>
                      <p className={`homepage-message-time ${message.sender}`}>
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    {message.sender === "user" && (
                      <div className="homepage-message-avatar user">
                        <User />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="homepage-input-area">
          <div className="homepage-input-wrapper">
            <div className="homepage-input-container">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleTextAreaChange}
                onKeyDown={handleKeyPress}
                placeholder="Ask me anything about your finances..."
                className="homepage-textarea"
                rows={1}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="homepage-send-button"
              >
                <Send />
              </button>
            </div>
            <p className="homepage-input-disclaimer">
              AI can make mistakes. Always verify important financial information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
