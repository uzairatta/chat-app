import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Hash, Send, LogOut, User, MessageSquare } from 'lucide-react';

// Connect to the Socket.io server
const SOCKET_SERVER_URL = "https://chat-app-server-production-04a9.up.railway.app";
const socket = io(SOCKET_SERVER_URL, { autoConnect: false });

const CHANNELS = ['general', 'random', 'tech', 'lounge'];

export default function App() {
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentRoom, setCurrentRoom] = useState('general');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  
  const messagesEndRef = useRef(null);

  // Connect and handle incoming messages
  useEffect(() => {
    socket.connect();

    socket.on('message', (msg) => {
      // Expecting msg: { username, room, message, timestamp }
      // If server doesn't provide a timestamp, we append one locally for the UI
      const incomingMessage = {
        ...msg,
        timestamp: msg.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages((prev) => [...prev, incomingMessage]);
    });

    return () => {
      socket.off('message');
      socket.disconnect();
    };
  }, []);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle joining a room
  const joinRoom = (roomName, user) => {
    if (!user) return;
    socket.emit('join', { username: user, room: roomName });
  };

  // Handle leaving a room
  const leaveRoom = (roomName, user) => {
    if (!user) return;
    socket.emit('leave', { username: user, room: roomName });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim()) {
      setIsLoggedIn(true);
      joinRoom(currentRoom, username.trim());
    }
  };

  const handleRoomChange = (newRoom) => {
    if (newRoom === currentRoom) return;
    leaveRoom(currentRoom, username);
    setCurrentRoom(newRoom);
    setMessages([]); // Clear chat view for the new room
    joinRoom(newRoom, username);
  };

 const handleSendMessage = (e) => {
  e.preventDefault();
  if (!messageText.trim()) return;

  const messageData = {
    username: username,
    room: currentRoom,
    message: messageText.trim(),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  socket.emit('send', messageData);
  
  // Add your own message to local state immediately
  setMessages((prev) => [...prev, messageData]);
  
  setMessageText('');
};

    socket.emit('send', messageData);
    setMessageText('');
  };

  const handleLogout = () => {
    leaveRoom(currentRoom, username);
    setIsLoggedIn(false);
    setUsername('');
    setMessages([]);
  };

  // Login Screen UI
  if (!isLoggedIn) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 font-sans antialiased">
        <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-100">
          <div className="flex flex-col items-center space-y-3 text-center">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <MessageSquare size={32} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome to ChatApp</h1>
            <p className="text-sm text-slate-500">Enter a username to join the discussion channels.</p>
          </div>
          
          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g., alex_dev"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-500 transition-all active:scale-[0.98]"
            >
              Join Server
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main Chat Interface UI
  return (
    <div className="flex h-screen w-screen bg-white font-sans antialiased text-slate-900 selection:bg-indigo-100">
      
      {/* Sidebar (Channels List) */}
      <div className="w-64 border-r border-slate-100 bg-slate-50/50 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="h-14 border-b border-slate-100 flex items-center px-4 font-bold tracking-tight text-slate-800 text-lg">
            Community Server
          </div>
          
          {/* Channels Navigation */}
          <div className="p-3 space-y-1">
            <span className="block px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Text Channels</span>
            {CHANNELS.map((room) => {
              const isActive = currentRoom === room;
              return (
                <button
                  key={room}
                  onClick={() => handleRoomChange(room)}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-600' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Hash size={16} className={isActive ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-500'} />
                  <span>{room}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* User Footer Profile */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{username}</p>
              <p className="text-[11px] text-slate-400">Connected</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"
            title="Leave Server"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        
        {/* Chat Top Bar */}
        <div className="h-14 border-b border-slate-100 flex items-center px-6 justify-between shrink-0 shadow-sm shadow-slate-100/40">
          <div className="flex items-center space-x-2">
            <Hash size={20} className="text-slate-400" />
            <span className="font-bold text-slate-800">{currentRoom}</span>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <MessageSquare size={40} className="stroke-[1.5] mb-2 opacity-60" />
              <p className="text-sm">Welcome to #{currentRoom}! Start the conversation.</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.username === username;
              return (
                <div 
                  key={index} 
                  className={`flex flex-col max-w-[75%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                >
                  {/* Meta: Username & Timestamp */}
                  <div className="flex items-baseline space-x-2 mb-1 px-1">
                    <span className="text-xs font-semibold text-slate-700">
                      {isMe ? 'You' : msg.username}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div 
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                      isMe 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-slate-100 text-slate-800 rounded-tl-none'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box Container */}
        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={`Message #${currentRoom}`}
              className="w-full bg-slate-100/80 placeholder-slate-400 text-sm text-slate-800 rounded-xl pl-4 pr-12 py-3.5 focus:outline-none focus:bg-slate-100 focus:ring-2 focus:ring-indigo-100 border border-transparent focus:border-indigo-200 transition-all"
            />
            <button
              type="submit"
              disabled={!messageText.trim()}
              className={`absolute right-2 p-2 rounded-lg transition-all ${
                messageText.trim() 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 shadow-sm' 
                  : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              <Send size={16} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

