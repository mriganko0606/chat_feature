import { NextRequest, NextResponse } from 'next/server';
import { ChatService } from '@/lib/database-services';
import { CreateChatData } from '@/lib/models';
import { ObjectId } from 'mongodb';

// GET /api/chats - Get all chats
export async function GET() {
  try {
    const chats = await ChatService.getAllChats();
    return NextResponse.json({ success: true, chats });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}

// POST /api/chats - Create a new chat
export async function POST(request: NextRequest) {
  try {
    const body: CreateChatData = await request.json();
    
    // Validate required fields
    if (!body.chatName || !body.users || body.users.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Chat name and users are required' },
        { status: 400 }
      );
    }

    // Convert string IDs to ObjectIds
    const userIds = body.users.map(userId => 
      typeof userId === 'string' ? new ObjectId(userId) : userId
    );

    const chatData: CreateChatData = {
      ...body,
      users: userIds,
      groupAdmin: body.groupAdmin ? 
        (typeof body.groupAdmin === 'string' ? new ObjectId(body.groupAdmin) : body.groupAdmin) 
        : undefined
    };

    const chat = await ChatService.createChat(chatData);
    return NextResponse.json({ success: true, chat }, { status: 201 });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create chat' },
      { status: 500 }
    );
  }
}
