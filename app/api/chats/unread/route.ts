import { NextRequest, NextResponse } from 'next/server';
import { ChatService } from '@/lib/database-services';

// GET /api/chats/unread?userId=USER_ID - Get chats with unread counts for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    const chats = await ChatService.getUserChatsWithUnreadCount(userId);
    return NextResponse.json({ success: true, chats });
  } catch (error) {
    console.error('Error fetching chats with unread count:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}
