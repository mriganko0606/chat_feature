import { NextRequest, NextResponse } from 'next/server';
import { ChatService, MessageService, UserService } from '@/lib/database-services';
import { ObjectId } from 'mongodb';

// GET /api/ai/chat-bot - Get or create AI bot chat for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Find existing AI bot chat for this user
    const chats = await ChatService.getUserChats(new ObjectId(userId));
    let aiBotChat = chats.find(chat => 
      !chat.isGroupChat && 
      chat.users.length === 2 &&
      (chat.chatName.toLowerCase().includes('ai bot') || chat.chatName.toLowerCase().includes('ai'))
    );

    // If no chat exists, create one
    if (!aiBotChat) {
      // Create or get AI bot user (we'll use a consistent ID based on userId)
      // In production, you might want to create actual AI bot users in the database
      const aiBotUserId = new ObjectId(); // This will be unique per chat creation
      
      aiBotChat = await ChatService.createChat({
        chatName: `AI Bot - ${userId}`,
        isGroupChat: false,
        users: [new ObjectId(userId), aiBotUserId],
      });
    }

    // Get messages for this chat
    const messages = await MessageService.getChatMessages(aiBotChat._id!.toString());

    // Find the AI bot user ID (the one that's not the current user)
    const aiBotUserId = aiBotChat.users.find(id => id.toString() !== userId)?.toString();

    return NextResponse.json({ 
      success: true, 
      chat: aiBotChat,
      messages,
      aiBotId: aiBotUserId
    });
  } catch (error) {
    console.error('Error getting AI bot chat:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get AI bot chat' },
      { status: 500 }
    );
  }
}

