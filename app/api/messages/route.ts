import { NextRequest, NextResponse } from 'next/server';
import { MessageService } from '@/lib/database-services';
import { CreateMessageData } from '@/lib/models';
import { ObjectId } from 'mongodb';

// GET /api/messages - Get all messages
export async function GET() {
  try {
    const messages = await MessageService.getAllMessages();
    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/messages - Create a new message
export async function POST(request: NextRequest) {
  try {
    const body: CreateMessageData = await request.json();
    
    console.log('API received message:', {
      messageType: body.messageType,
      hasImageUrl: !!body.imageUrl,
      imageUrl: body.imageUrl,
      content: body.content,
      fullBody: body
    });
    
    // Validate required fields
    if (!body.sender || !body.chat) {
      return NextResponse.json(
        { success: false, message: 'Sender and chat are required' },
        { status: 400 }
      );
    }

    // For text messages, content is required
    if (body.messageType === 'text' && !body.content) {
      return NextResponse.json(
        { success: false, message: 'Content is required for text messages' },
        { status: 400 }
      );
    }

    // For image messages, imageUrl is required
    if (body.messageType === 'image' && !body.imageUrl) {
      return NextResponse.json(
        { success: false, message: 'Image URL is required for image messages' },
        { status: 400 }
      );
    }

    // Convert string IDs to ObjectIds
    const messageData: CreateMessageData = {
      ...body,
      sender: typeof body.sender === 'string' ? new ObjectId(body.sender) : body.sender,
      chat: typeof body.chat === 'string' ? new ObjectId(body.chat) : body.chat,
      replyTo: body.replyTo ? 
        (typeof body.replyTo === 'string' ? new ObjectId(body.replyTo) : body.replyTo) : 
        undefined,
      readBy: body.readBy ? 
        body.readBy.map(userId => 
          typeof userId === 'string' ? new ObjectId(userId) : userId
        ) : []
    };

    const message = await MessageService.createMessage(messageData);
    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create message' },
      { status: 500 }
    );
  }
}
