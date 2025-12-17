'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useRouter, usePathname } from 'next/navigation';
import Loading from '@/components/Loading';
import DoctorSidebar from '@/components/DoctorSidebar';
import MedicineAdPanel from '@/components/MedicineAdPanel';
import BottomAdPanel from '@/components/BottomAdPanel';
import api from '@/lib/api';
import { format, formatDistanceToNow } from 'date-fns';
import { FiSend, FiSearch, FiPhone, FiMoreVertical, FiPaperclip, FiMessageCircle, FiLogOut } from 'react-icons/fi';

export default function DoctorChatPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const pathname = usePathname();
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
    if (!authLoading && (!user || user.role !== 'doctor')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'doctor') {
      fetchChatUsers();
      fetchConversations();
      fetchUnreadCount();
    }
  }, [user]);

  // Real-time polling: Update users, conversations, and messages every 2 seconds
  useEffect(() => {
    if (user && user.role === 'doctor') {
      // Poll for chat users and conversations even when no conversation is selected
      const globalPollInterval = setInterval(() => {
        console.log('=== POLLING START ===', new Date().toISOString());
        fetchChatUsers();
        fetchConversations();
        fetchUnreadCount();
        if (selectedConversation?.id) {
          console.log('Polling: Fetching messages for conversation:', selectedConversation.id);
          fetchMessages(selectedConversation.id, false).then(() => {
            console.log('Polling: Messages fetched successfully');
          }).catch((err) => {
            console.error('Polling: Error fetching messages:', err);
          });
        }
        console.log('=== POLLING END ===');
      }, 2000);

      return () => {
        clearInterval(globalPollInterval);
      };
    }
  }, [user, selectedConversation?.id]); // Only depend on selectedConversation.id, not the whole object
  
  // Separate effect to handle conversation updates
  useEffect(() => {
    if (selectedConversation && conversations.length > 0) {
      const updated = conversations.find((c: any) => c.id === selectedConversation.id);
      if (updated) {
        // Check if there are new messages or unread count changed
        const hasNewMessage = updated.lastMessage !== selectedConversation.lastMessage;
        const hasNewUnread = updated.unreadCount !== selectedConversation.unreadCount;
        
        if (hasNewMessage || hasNewUnread) {
          console.log('Conversation updated, refreshing messages...', {
            hasNewMessage,
            hasNewUnread,
            oldLastMessage: selectedConversation.lastMessage,
            newLastMessage: updated.lastMessage,
            oldUnread: selectedConversation.unreadCount,
            newUnread: updated.unreadCount
          });
          setSelectedConversation(updated);
          // Fetch messages to get the latest
          fetchMessages(selectedConversation.id, false);
        } else {
          // Still update the conversation object to keep it in sync
          setSelectedConversation(updated);
        }
      }
    }
  }, [conversations, selectedConversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages when selectedConversation changes
  useEffect(() => {
    if (selectedConversation && selectedConversation.id) {
      console.log('Selected conversation changed, fetching messages for:', selectedConversation.id);
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


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
      const newConversations = response.data.conversations || [];
      console.log('Fetched conversations:', newConversations.length);
      
      // Sort conversations by lastMessageTime (newest first) before setting
      const sortedConversations = [...newConversations].sort((a: any, b: any) => {
        // Get timestamps, handling null/undefined properly
        const timeA = a.lastMessageTime 
          ? (new Date(a.lastMessageTime).getTime() || 0)
          : 0;
        const timeB = b.lastMessageTime 
          ? (new Date(b.lastMessageTime).getTime() || 0)
          : 0;
        
        // Newest first (larger timestamp = more recent)
        if (timeB !== timeA) {
          return timeB - timeA;
        }
        // If same time, sort by name
        return (a.name || '').localeCompare(b.name || '');
      });
      
      setConversations(sortedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: string, preserveTempMessages = false) => {
    try {
      console.log('🔄 Fetching messages for user:', userId, 'preserveTemp:', preserveTempMessages);
      const response = await api.get(`/chat/messages/${userId}`);
      const fetchedMessages = response.data.messages || [];
      console.log('✅ Fetched messages for user', userId, ':', fetchedMessages.length, 'messages');
      console.log('📨 Messages data:', fetchedMessages.map((m: any) => ({ 
        id: m.id, 
        content: m.content?.substring(0, 30) || 'empty', 
        senderId: m.senderId, 
        receiverId: m.receiverId,
        createdAt: m.createdAt
      })));
      
      if (preserveTempMessages) {
        // Keep temporary messages that haven't been saved yet
        setMessages((prev) => {
          const tempMessages = prev.filter((msg) => msg.id.startsWith('temp-'));
          const realMessageIds = new Set(fetchedMessages.map((m: any) => m.id));
          const tempToKeep = tempMessages.filter((msg) => {
            // Keep temp message if we don't have a real message with same content yet
            return !fetchedMessages.some((m: any) => 
              m.content === msg.content && 
              m.senderId === msg.senderId && 
              Math.abs(new Date(m.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 5000
            );
          });
          const combined = [...fetchedMessages, ...tempToKeep].sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          console.log('📊 Combined messages:', combined.length, '(real:', fetchedMessages.length, 'temp:', tempToKeep.length, ')');
          return combined;
        });
      } else {
        // Remove any temporary messages (optimistic updates) when real messages arrive
        console.log('📝 Setting messages directly:', fetchedMessages.length);
        setMessages(fetchedMessages);
      }
      
      // Scroll to bottom after fetching messages
      setTimeout(() => scrollToBottom(), 150);
    } catch (error: any) {
      console.error('❌ Error fetching messages for user', userId, ':', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/chat/unread-count');
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleSelectConversation = (conversation: any) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleSelectUser = (user: any) => {
    // Check if conversation exists
    const existingConversation = conversations.find(c => c.id === user.id);
    if (existingConversation) {
      handleSelectConversation(existingConversation);
    } else {
      // Create new conversation object
      const newConversation = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        lastMessage: user.lastMessage || 'No messages yet',
        lastMessageTime: user.lastMessageTime || new Date(),
        unreadCount: user.unreadCount || 0,
      };
      setSelectedConversation(newConversation);
      // Fetch messages immediately when selecting a new user
      fetchMessages(user.id);
    }
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const filteredUsers = allUsers.filter((user: any) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const messageContent = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    
    // Optimistically add message to UI immediately
    const optimisticMessage = {
      id: tempId,
      content: messageContent,
      senderId: user.id,
      receiverId: selectedConversation.id,
      createdAt: new Date().toISOString(),
      isRead: false,
      sender: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
    
    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage('');
    
    // Scroll to bottom immediately
    setTimeout(() => scrollToBottom(), 50);

    try {
      const response = await api.post('/chat/send', {
        receiverId: selectedConversation.id,
        content: messageContent,
      });
      
      console.log('Message sent successfully:', response.data);
      
      // Immediately update the conversation in the list to move it to top
      const now = new Date().toISOString();
      setConversations((prev) => {
        const updated = prev.map((conv: any) => 
          conv.id === selectedConversation.id
            ? { ...conv, lastMessage: messageContent, lastMessageTime: now }
            : conv
        );
        // Re-sort by lastMessageTime (newest first)
        return updated.sort((a: any, b: any) => {
          // Get timestamps, handling null/undefined properly
          const timeA = a.lastMessageTime 
            ? (new Date(a.lastMessageTime).getTime() || 0)
            : 0;
          const timeB = b.lastMessageTime 
            ? (new Date(b.lastMessageTime).getTime() || 0)
            : 0;
          
          // Newest first (larger timestamp = more recent)
          if (timeB !== timeA) {
            return timeB - timeA;
          }
          // If same time, sort by name
          return (a.name || '').localeCompare(b.name || '');
        });
      });
      
      // Also update selected conversation
      setSelectedConversation((prev: any) => 
        prev ? { ...prev, lastMessage: messageContent, lastMessageTime: now } : prev
      );
      
      // Fetch real messages immediately (preserve temp messages in case backend is slow)
      fetchMessages(selectedConversation.id, true);
      fetchConversations(); // This will sync with backend
      fetchChatUsers();
      fetchUnreadCount();
      
      // Also fetch again after a delay to ensure we get the persisted message
      setTimeout(() => {
        fetchMessages(selectedConversation.id, false); // Now remove temp messages
        fetchConversations(); // Sync with backend again
      }, 1000);
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setNewMessage(messageContent);
      showNotification('Failed to send message', 'error');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getInitialsForUser = (name: string) => {
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

  if (!user || user.role !== 'doctor') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MedicineAdPanel targetAudience="doctor" />
      <DoctorSidebar user={user} logout={logout} />
      <BottomAdPanel />
      <main className="w-full flex-1 transition-all duration-300 flex flex-col h-screen lg:ml-[476px] pb-[180px] overflow-x-hidden">
        {/* Modern Header with Simple Color */}
        <header className="bg-teal-600 text-white shadow-xl">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold mb-2">Chats</h1>
            <p className="text-teal-100">Communicate with your patients</p>
          </div>
        </header>

        {/* Chat Container */}
        <div className="flex-1 flex overflow-hidden">
          {/* Conversations List */}
          <div className="w-1/3 border-r-2 border-gray-200 bg-white flex flex-col">
          <div className="p-4 bg-gray-50 border-b-2 border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-3">Messages</h2>
            {/* Search Bar with Auto-suggestions */}
            <div className="relative">
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
                  // Delay hiding to allow click on suggestion
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                placeholder="Search by name or email..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white shadow-lg"
              />
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
              {showSuggestions && filteredUsers.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border-2 border-teal-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                  {filteredUsers.slice(0, 5).map((user: any) => (
                    <div
                      key={user.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectUser(user);
                      }}
                      className="px-4 py-3 hover:bg-teal-50 cursor-pointer border-b-2 border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-sm">
                          {getInitialsForUser(user.name)}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800">{user.name}</p>
                          <p className="text-xs text-gray-600 capitalize">{user.role}</p>
                        </div>
                        {user.unreadCount > 0 && (
                          <span className="bg-teal-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                            {user.unreadCount}
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
            {/* Show conversations first (people who have sent/received messages), then other users */}
            {(() => {
              // Ensure conversations are sorted by lastMessageTime (newest first) before using
              const sortedConversations = [...conversations].sort((a: any, b: any) => {
                const timeA = a.lastMessageTime 
                  ? (new Date(a.lastMessageTime).getTime() || 0)
                  : 0;
                const timeB = b.lastMessageTime 
                  ? (new Date(b.lastMessageTime).getTime() || 0)
                  : 0;
                return timeB - timeA; // Newest first
              });
              
              // Combine conversations and users, prioritizing conversations
              const allItems: any[] = [];
              const conversationIds = new Set(sortedConversations.map((c: any) => c.id));
              
              // Add conversations first (already sorted by last message time)
              sortedConversations.forEach((conv: any) => {
                allItems.push({ ...conv, isConversation: true });
              });
              
              // Add users who don't have conversations yet
              allUsers.forEach((user: any) => {
                if (!conversationIds.has(user.id)) {
                  allItems.push({ ...user, isConversation: false });
                }
              });
              
              // Final sort: conversations by lastMessageTime (newest first), then users by name
              allItems.sort((a, b) => {
                if (a.isConversation && b.isConversation) {
                  // Get timestamps, handling null/undefined properly
                  const timeA = a.lastMessageTime 
                    ? (new Date(a.lastMessageTime).getTime() || 0)
                    : 0;
                  const timeB = b.lastMessageTime 
                    ? (new Date(b.lastMessageTime).getTime() || 0)
                    : 0;
                  
                  // Newest first (larger timestamp = more recent)
                  if (timeB !== timeA) {
                    return timeB - timeA;
                  }
                  // If same time, sort by name
                  return (a.name || '').localeCompare(b.name || '');
                }
                if (a.isConversation && !b.isConversation) return -1;
                if (!a.isConversation && b.isConversation) return 1;
                return (a.name || '').localeCompare(b.name || '');
              });
              
              // Final verification sort - ensure conversations are definitely sorted by newest first
              const finalSortedItems = [...allItems].sort((a, b) => {
                if (a.isConversation && b.isConversation) {
                  const timeA = a.lastMessageTime 
                    ? (new Date(a.lastMessageTime).getTime() || 0)
                    : 0;
                  const timeB = b.lastMessageTime 
                    ? (new Date(b.lastMessageTime).getTime() || 0)
                    : 0;
                  // Newest first
                  return timeB - timeA;
                }
                if (a.isConversation && !b.isConversation) return -1;
                if (!a.isConversation && b.isConversation) return 1;
                return (a.name || '').localeCompare(b.name || '');
              });
              
              if (finalSortedItems.length === 0) {
                return (
                  <div className="p-8 text-center text-gray-500">
                    <p>No users available</p>
                  </div>
                );
              }
              
              return finalSortedItems.map((item: any) => {
                const isSelected = selectedConversation?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.isConversation) {
                        handleSelectConversation(item);
                      } else {
                        handleSelectUser(item);
                      }
                    }}
                    className={`p-4 border-b-2 border-gray-200 cursor-pointer hover:bg-teal-50 transition-colors ${
                      isSelected ? 'bg-teal-100 border-teal-300' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600 font-bold">
                        {getInitialsForUser(item.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-gray-800 truncate">{item.name}</h3>
                          {item.lastMessageTime && (
                            <span className="text-xs text-gray-500 font-semibold">
                              {formatDistanceToNow(new Date(item.lastMessageTime), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate mt-1">{item.lastMessage || 'No messages yet'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-500 capitalize font-semibold">{item.role}</p>
                        </div>
                      </div>
                      {(item.unreadCount > 0 || (item.isConversation && item.unreadCount > 0)) && (
                        <span className="bg-teal-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                          {item.unreadCount || 0}
                        </span>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

          {/* Chat Area - Show on mobile when conversation selected */}
          <div className={`${selectedConversation ? 'flex' : 'hidden lg:flex'} flex-1 flex-col bg-gray-50`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b-2 border-gray-300 p-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600 font-bold">
                    {getInitialsForUser(selectedConversation.name)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{selectedConversation.name}</h3>
                    <p className="text-xs text-gray-500 capitalize font-semibold">{selectedConversation.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedConversation.phone && (
                    <a
                      href={`tel:${selectedConversation.phone}`}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title={`Call ${selectedConversation.phone}`}
                    >
                      <FiPhone className="text-xl text-gray-600" />
                    </a>
                  )}
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <FiMoreVertical className="text-xl text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <FiMessageCircle className="text-4xl mx-auto mb-2 opacity-50" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  </div>
                )}
                {messages.map((message) => {
                  const isOwn = message.senderId === user.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-800 border border-gray-200'
                        }`}
                      >
                        {!isOwn && (
                          <p className="text-xs font-semibold mb-1 opacity-75">
                            {message.sender.name}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <p className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                            {format(new Date(message.createdAt), 'h:mm a')}
                          </p>
                          {isOwn && (
                            <div className="flex items-center">
                              {message.isRead ? (
                                <span className="text-blue-300 text-xs ml-1 flex items-center gap-0.5">
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
              <div className="bg-white border-t border-gray-200 p-4">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FiPaperclip className="text-xl text-gray-600" />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiSend className="text-xl" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FiMessageCircle className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Select a conversation to start chatting</p>
              </div>
            </div>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}