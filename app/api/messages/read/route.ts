import { NextRequest, NextResponse } from 'next/server';
import { MessageService } from '@/lib/database-services';

// POST /api/messages/read - Mark messages as read
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatId, userId } = body;

    if (!chatId || !userId) {
      return NextResponse.json(
        { success: false, message: 'Chat ID and User ID are required' },
        { status: 400 }
      );
    }

    await MessageService.markMessagesAsRead(chatId, userId);
    return NextResponse.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
