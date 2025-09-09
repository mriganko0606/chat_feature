"use client";

import { useSocket } from "@/lib/socket-context";
import { useState } from "react";

export default function TestSocketPage() {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<string[]>([]);
  const [testMessage, setTestMessage] = useState("");

  const sendTestMessage = () => {
    if (socket && testMessage.trim()) {
      socket.emit("test-message", testMessage);
      setMessages(prev => [...prev, `Sent: ${testMessage}`]);
      setTestMessage("");
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Socket.io Test Page</h1>
      
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="font-medium">
            Status: {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Socket ID: {socket?.id || 'Not connected'}
        </p>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Test Messages</h2>
        <div className="border rounded-lg p-4 h-48 overflow-y-auto bg-muted/20">
          {messages.length === 0 ? (
            <p className="text-muted-foreground">No messages yet</p>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className="mb-1 text-sm">
                {msg}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          placeholder="Type a test message..."
          className="flex-1 px-3 py-2 border rounded-md"
          onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
        />
        <button
          onClick={sendTestMessage}
          disabled={!isConnected || !testMessage.trim()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
        >
          Send
        </button>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Make sure the Socket.io server is running: <code>npm run dev:socket</code></li>
          <li>Check the connection status above</li>
          <li>Send test messages to verify the connection</li>
          <li>Open this page in multiple tabs to test real-time features</li>
        </ol>
      </div>
    </div>
  );
}
