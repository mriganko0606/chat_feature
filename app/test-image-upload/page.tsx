"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TestImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; imageUrl?: string; message: string; error?: string } | null>(null);

  const handleTestUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Upload error:', error);
      setResult({ success: false, message: 'Upload failed', error: 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const testImageMessage = async () => {
    if (!result?.imageUrl) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: "507f1f77bcf86cd799439011", // Replace with actual user ID
          content: "",
          chat: "507f1f77bcf86cd799439012", // Replace with actual chat ID
          imageUrl: result.imageUrl,
          messageType: "image",
          readBy: []
        })
      });

      const data = await response.json();
      console.log('Message created:', data);
      alert('Image message created successfully! Check your database.');
    } catch (error) {
      console.error('Message creation error:', error);
      alert('Failed to create message');
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test Image Upload</h1>
      
      <div className="space-y-4">
        <div>
          <Input
            type="file"
            accept="image/*"
            onChange={handleTestUpload}
            disabled={uploading}
          />
        </div>

        {uploading && <p>Uploading...</p>}

        {result && (
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Upload Result:</h3>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
            
            {result.success && (
              <div className="mt-4">
                <img 
                  src={result.imageUrl} 
                  alt="Uploaded" 
                  className="max-w-full h-32 object-cover rounded"
                />
                <Button 
                  onClick={testImageMessage}
                  className="mt-2"
                >
                  Test Save to Database
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
