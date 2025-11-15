import { NextRequest, NextResponse } from 'next/server';
import { Mistral } from "@mistralai/mistralai";

// Initialize Mistral client
const mistral = new Mistral({
  apiKey: "OUtiW6Y5oNGOLcOqwtEiyjEWrHMtfJSo",
});

// POST /api/ai/chat - Get AI bot response using Mistral AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Message is required' },
        { status: 400 }
      );
    }


    // Generate AI response using Mistral
    const aiResponse = await generateAIResponse(message, conversationHistory);

    return NextResponse.json({ 
      success: true, 
      response: aiResponse 
    });
  } catch (error) {
    console.error('Error getting AI response:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}

// Generate AI response using Mistral
interface ConversationMessage {
  sender: 'user' | 'ai';
  content: string;
}

async function generateAIResponse(message: string, conversationHistory: ConversationMessage[] = []): Promise<string> {
  try {
    // Build messages array for Mistral
    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.sender === 'ai' ? 'assistant' : 'user' as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: message,
      },
    ];

    // Call Mistral API
    const result = await mistral.chat.complete({
      model: process.env.MISTRAL_MODEL || "mistral-small-latest",
      messages: messages,
    });

    // Extract response text
    const content = result.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from Mistral AI');
    }

    // Handle both string and ContentChunk[] types
    const response = typeof content === 'string' 
      ? content 
      : content.map(chunk => {
          if (typeof chunk === 'string') return chunk;
          if ('text' in chunk) return (chunk as { text: string }).text;
          return '';
        }).join('');

    return response;
  } catch (error) {
    console.error('Error calling Mistral AI:', error);
    // Fallback response
    return "I'm sorry, I'm having trouble processing that right now. Please try again.";
  }
}

