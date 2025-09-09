import { NextRequest, NextResponse } from 'next/server';
import { MessageService } from '@/lib/database-services';

// GET /api/chats/[chatId]/messages - Get messages for a specific chat
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

    const messages = await MessageService.getChatMessages(chatId);
    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch chat messages' },
      { status: 500 }
    );
  }
}
