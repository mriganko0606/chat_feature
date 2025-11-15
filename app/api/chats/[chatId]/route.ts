import { NextRequest, NextResponse } from 'next/server';
import { ChatService } from '@/lib/database-services';

// GET /api/chats/[chatId] - Get a specific chat
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    
    if (!chatId) {
      return NextResponse.json(
        { success: false, message: 'Chat ID is required' },
        { status: 400 }
      );
    }

    const chat = await ChatService.getChatById(chatId);
    
    if (!chat) {
      return NextResponse.json(
        { success: false, message: 'Chat not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, chat });
  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch chat' },
      { status: 500 }
    );
  }
}

