'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import Loading from '@/components/Loading';
import api from '@/lib/api';
import { format, formatDistanceToNow } from 'date-fns';
import { FiSearch, FiSend, FiMessageCircle, FiPaperclip } from 'react-icons/fi';

export default function AdminChatsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && user.role !== 'admin') {
      if (user.role === 'patient') {
        router.push('/patient/dashboard');
      } else if (user.role === 'doctor') {
        router.push('/doctor/dashboard');
      } else {
        router.push('/dashboard');
      }
      return;
    }
    if (user && user.role === 'admin') {
      fetchChatUsers();
      fetchConversations();
      fetchUnreadCount();
    }
  }, [user, authLoading, router]);

  // Real-time polling
  useEffect(() => {
    if (user && user.role === 'admin') {
      const globalPollInterval = setInterval(() => {
        fetchChatUsers();
        fetchConversations();
        if (selectedConversation) {
          fetchMessages(selectedConversation.id);
        }
        fetchUnreadCount();
      }, 2000);

      return () => clearInterval(globalPollInterval);
    }
  }, [user, selectedConversation]);

  useEffect(() => {
    if (selectedConversation) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      pollingIntervalRef.current = setInterval(() => {
        fetchMessages(selectedConversation.id);
        fetchConversations();
        fetchUnreadCount();
      }, 2000);
    }
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChatUsers = async () => {
    try {
      const response = await api.get('/chat/users');
      setAllUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching chat users:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await api.get('/chat/conversations');
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      const response = await api.get(`/chat/messages/${userId}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/chat/unread-count');
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conversation: any) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleSelectUser = (userItem: any) => {
    const existingConversation = conversations.find(c => c.id === userItem.id);
    if (existingConversation) {
      handleSelectConversation(existingConversation);
    } else {
      const newConversation = {
        id: userItem.id,
        name: userItem.name,
        email: userItem.email,
        role: userItem.role,
        phone: userItem.phone,
        lastMessage: userItem.lastMessage || 'No messages yet',
        lastMessageTime: userItem.lastMessageTime || new Date(),
        unreadCount: userItem.unreadCount || 0,
      };
      setSelectedConversation(newConversation);
      setMessages([]);
    }
    setSearchQuery('');
    setShowSuggestions(false);
  };

  // Search by ID, name, email, or phone
  const filteredUsers = allUsers.filter((userItem: any) => {
    const query = searchQuery.toLowerCase();
    return (
      userItem.name.toLowerCase().includes(query) ||
      userItem.email.toLowerCase().includes(query) ||
      userItem.id.toLowerCase().includes(query) ||
      (userItem.phone && userItem.phone.includes(query)) ||
      userItem.role.toLowerCase().includes(query)
    );
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await api.post('/chat/send', {
        receiverId: selectedConversation.id,
        content: newMessage.trim(),
      });
      setNewMessage('');
      setTimeout(() => {
        fetchMessages(selectedConversation.id);
        fetchConversations();
        fetchChatUsers();
        fetchUnreadCount();
      }, 100);
    } catch (error: any) {
      console.error('Error sending message:', error);
      showNotification(error.response?.data?.message || 'Failed to send message', 'error');
    }
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      ?.map((n: string) => n[0])
      ?.join('')
      ?.toUpperCase()
      ?.slice(0, 2) || 'U';
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar />
      <main className="ml-64 flex-1 transition-all duration-300">
        <AdminHeader
          title={`Chats ${unreadCount > 0 ? `(${unreadCount})` : ''}`}
          searchPlaceholder="Search by ID, name, email..."
          onSearch={(query) => {
            setSearchQuery(query);
            setShowSuggestions(query.length > 0);
          }}
        />
        <div className="p-8">
          <div className="flex flex-col h-[calc(100vh-200px)] bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-colors">
            <div className="flex flex-1 overflow-hidden">
              {/* Conversations List */}
              <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col transition-colors">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
                    All Users {unreadCount > 0 && `(${unreadCount})`}
                  </h2>
                  {/* Search Bar with Auto-suggestions */}
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSuggestions(e.target.value.length > 0);
                      }}
                      onFocus={() => {
                        if (searchQuery.length > 0) {
                          setShowSuggestions(true);
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowSuggestions(false), 200);
                      }}
                      placeholder="Search by ID, name, email..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                    />
                    {showSuggestions && filteredUsers.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto transition-colors">
                        {filteredUsers.slice(0, 5).map((userItem: any) => (
                          <div
                            key={userItem.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectUser(userItem);
                            }}
                            className="px-4 py-3 hover:bg-teal-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                                {getInitials(userItem.name)}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-800 dark:text-gray-100">{userItem.name}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{userItem.role}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">ID: {userItem.id.slice(0, 8)}...</p>
                              </div>
                              {userItem.unreadCount > 0 && (
                                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                                  {userItem.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {allUsers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <p>No users available</p>
                    </div>
                  ) : (
                    filteredUsers.map((userItem: any) => {
                      const conversation = conversations.find(c => c.id === userItem.id);
                      const isSelected = selectedConversation?.id === userItem.id;
                      const displayData = conversation || userItem;
                      return (
                        <div
                          key={userItem.id}
                          onClick={() => handleSelectUser(userItem)}
                          className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            isSelected ? 'bg-teal-50 dark:bg-gray-700 border-l-4 border-teal-600' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                              {getInitials(userItem.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-800 dark:text-gray-100 truncate">{userItem.name}</h3>
                                {displayData.lastMessageTime && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDistanceToNow(new Date(displayData.lastMessageTime), { addSuffix: true })}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">{displayData.lastMessage || 'No messages yet'}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-gray-500 dark:text-gray-500">ID: {userItem.id.slice(0, 8)}...</p>
                                <span className="text-xs text-gray-400">•</span>
                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{userItem.role}</p>
                              </div>
                            </div>
                            {userItem.unreadCount > 0 && (
                              <span className="bg-teal-600 text-white text-xs px-2 py-1 rounded-full">
                                {userItem.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                          {getInitials(selectedConversation.name)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-gray-100">{selectedConversation.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{selectedConversation.role}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">ID: {selectedConversation.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((message) => {
                        const isOwn = message.senderId === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                                isOwn
                                  ? 'bg-teal-600 text-white'
                                  : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600'
                              } transition-colors`}
                            >
                              {!isOwn && (
                                <p className="text-xs font-semibold mb-1 opacity-75">
                                  {message.sender.name}
                                </p>
                              )}
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <p className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                  {format(new Date(message.createdAt), 'h:mm a')}
                                </p>
                                {isOwn && (
                                  <div className="flex items-center">
                                    {message.isRead ? (
                                      <span className="text-blue-300 text-xs ml-1 flex items-center gap-0.5">
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-[10px]">Seen</span>
                                      </span>
                                    ) : (
                                      <span className="text-gray-300 text-xs ml-1">
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 transition-colors">
                      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <button
                          type="button"
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <FiPaperclip className="text-xl text-gray-600 dark:text-gray-300" />
                        </button>
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                        />
                        <button
                          type="submit"
                          disabled={!newMessage.trim()}
                          className="p-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FiSend className="text-xl" />
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <FiMessageCircle className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 text-lg">Select a user to start chatting</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Search by ID, name, email, or phone</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}