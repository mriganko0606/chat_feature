"use client";

import { useState, useEffect } from "react";
import { Chat, Message } from "@/lib/models";

export default function TestApiPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const testChats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/chats');
      const data = await response.json();
      console.log('Chats response:', data);
      setChats(data.chats || []);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const testMessages = async () => {
    if (chats.length === 0) return;
    
    setLoading(true);
    try {
      const chatId = chats[0]._id;
      const response = await fetch(`/api/chats/${chatId}/messages`);
      const data = await response.json();
      console.log('Messages response:', data);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      
      <div className="space-y-4">
        <div>
          <button
            onClick={testChats}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Test Chats API'}
          </button>
        </div>

        <div>
          <button
            onClick={testMessages}
            disabled={loading || chats.length === 0}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Test Messages API'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Chats ({chats.length})</h2>
            <div className="border rounded p-4 h-64 overflow-y-auto">
              {chats.length === 0 ? (
                <p className="text-muted-foreground">No chats loaded</p>
              ) : (
                <pre className="text-xs">{JSON.stringify(chats, null, 2)}</pre>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Messages ({messages.length})</h2>
            <div className="border rounded p-4 h-64 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-muted-foreground">No messages loaded</p>
              ) : (
                <pre className="text-xs">{JSON.stringify(messages, null, 2)}</pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
