import { ObjectId } from 'mongodb';
import { getCollection } from './mongodb';
import { User, Chat, Message, Product, CreateUserData, CreateChatData, CreateMessageData, CreateProductData, createUserDocument, createChatDocument, createMessageDocument, createProductDocument } from './models';

// User Services
export class UserService {
  static async createUser(userData: CreateUserData): Promise<User> {
    const users = await getCollection('users');
    const userDoc = createUserDocument(userData);
    const result = await users.insertOne(userDoc);
    return { ...userDoc, _id: result.insertedId };
  }

  static async getUserById(id: string | ObjectId): Promise<User | null> {
    const users = await getCollection('users');
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await users.findOne({ _id: objectId });
    return result as User | null;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const users = await getCollection('users');
    const result = await users.findOne({ email });
    return result as User | null;
  }

  static async updateUser(id: string | ObjectId, updateData: Partial<User>): Promise<User | null> {
    const users = await getCollection('users');
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await users.findOneAndUpdate(
      { _id: objectId },
      { $set: { ...updateData, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return result as User | null;
  }

  static async deleteUser(id: string | ObjectId): Promise<boolean> {
    const users = await getCollection('users');
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await users.deleteOne({ _id: objectId });
    return result.deletedCount > 0;
  }

  static async getAllUsers(): Promise<User[]> {
    const users = await getCollection('users');
    const result = await users.find({}).toArray();
    return result as User[];
  }
}

// Chat Services
export class ChatService {
  static async createChat(chatData: CreateChatData): Promise<Chat> {
    const chats = await getCollection('chats');
    const chatDoc = createChatDocument(chatData);
    const result = await chats.insertOne(chatDoc);
    return { ...chatDoc, _id: result.insertedId };
  }

  static async getChatById(id: string | ObjectId): Promise<Chat | null> {
    const chats = await getCollection('chats');
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await chats.findOne({ _id: objectId });
    return result as Chat | null;
  }

  static async getUserChats(userId: string | ObjectId): Promise<Chat[]> {
    const chats = await getCollection('chats');
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    const result = await chats.find({ users: objectId }).toArray();
    return result as Chat[];
  }

  static async updateChat(id: string | ObjectId, updateData: Partial<Chat>): Promise<Chat | null> {
    const chats = await getCollection('chats');
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await chats.findOneAndUpdate(
      { _id: objectId },
      { $set: { ...updateData, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return result as Chat | null;
  }

  static async deleteChat(id: string | ObjectId): Promise<boolean> {
    const chats = await getCollection('chats');
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await chats.deleteOne({ _id: objectId });
    return result.deletedCount > 0;
  }

  static async getAllChats(): Promise<Chat[]> {
    const chats = await getCollection('chats');
    const result = await chats.find({}).toArray();
    return result as Chat[];
  }

  static async getUserChatsWithUnreadCount(userId: string | ObjectId): Promise<Chat[]> {
    const chats = await getCollection('chats');
    const messages = await getCollection('messages');
    const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    
    // Get all chats where user is a participant
    const userChats = await chats.find({ 
      users: userObjectId 
    }).toArray() as Chat[];

    // Calculate unread count for each chat
    const chatsWithUnreadCount = await Promise.all(
      userChats.map(async (chat) => {
        const unreadCount = await messages.countDocuments({
          chat: chat._id,
          sender: { $ne: userObjectId },
          readBy: { $ne: userObjectId }
        });
        
        return {
          ...chat,
          unreadCount: { [userObjectId.toString()]: unreadCount }
        };
      })
    );

    return chatsWithUnreadCount;
  }
}

// Message Services
export class MessageService {
  static async createMessage(messageData: CreateMessageData): Promise<Message> {
    const messages = await getCollection('messages');
    const messageDoc = createMessageDocument(messageData);
    
    console.log('Creating message document:', {
      messageType: messageDoc.messageType,
      hasImageUrl: !!messageDoc.imageUrl,
      imageUrl: messageDoc.imageUrl,
      content: messageDoc.content
    });
    
    const result = await messages.insertOne(messageDoc);
    return { ...messageDoc, _id: result.insertedId };
  }

  static async getMessageById(id: string | ObjectId): Promise<Message | null> {
    const messages = await getCollection('messages');
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await messages.findOne({ _id: objectId });
    return result as Message | null;
  }

  static async getChatMessages(chatId: string | ObjectId): Promise<Message[]> {
    const messages = await getCollection('messages');
    const objectId = typeof chatId === 'string' ? new ObjectId(chatId) : chatId;
    const result = await messages.find({ chat: objectId }).sort({ createdAt: 1 }).toArray();
    return result as Message[];
  }

  static async markMessageAsRead(messageId: string | ObjectId, userId: string | ObjectId): Promise<Message | null> {
    const messages = await getCollection('messages');
    const messageObjectId = typeof messageId === 'string' ? new ObjectId(messageId) : messageId;
    const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    
    const result = await messages.findOneAndUpdate(
      { _id: messageObjectId },
      { 
        $addToSet: { readBy: userObjectId },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    );
    return result as Message | null;
  }

  static async updateMessage(id: string | ObjectId, updateData: Partial<Message>): Promise<Message | null> {
    const messages = await getCollection('messages');
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await messages.findOneAndUpdate(
      { _id: objectId },
      { $set: { ...updateData, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return result as Message | null;
  }

  static async deleteMessage(id: string | ObjectId): Promise<boolean> {
    const messages = await getCollection('messages');
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await messages.deleteOne({ _id: objectId });
    return result.deletedCount > 0;
  }

  static async getAllMessages(): Promise<Message[]> {
    const messages = await getCollection('messages');
    const result = await messages.find({}).toArray();
    return result as Message[];
  }

  static async markMessagesAsRead(chatId: string | ObjectId, userId: string | ObjectId): Promise<void> {
    const messages = await getCollection('messages');
    const chatObjectId = typeof chatId === 'string' ? new ObjectId(chatId) : chatId;
    const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    
    await messages.updateMany(
      { 
        chat: chatObjectId,
        sender: { $ne: userObjectId },
        readBy: { $ne: userObjectId }
      },
      { 
        $addToSet: { readBy: userObjectId }
      }
    );
  }
}

// Product Services
export class ProductService {
  static async createProduct(productData: CreateProductData): Promise<Product> {
    const products = await getCollection('products');
    const productDoc = createProductDocument(productData);
    const result = await products.insertOne(productDoc);
    return { ...productDoc, _id: result.insertedId };
  }

  static async getProductById(id: string | ObjectId): Promise<Product | null> {
    const products = await getCollection('products');
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await products.findOne({ _id: objectId });
    return result as Product | null;
  }

  static async updateProduct(id: string | ObjectId, updateData: Partial<CreateProductData>): Promise<Product | null> {
    const products = await getCollection('products');
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await products.findOneAndUpdate(
      { _id: objectId },
      { $set: { ...updateData, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return result as Product | null;
  }

  static async deleteProduct(id: string | ObjectId): Promise<boolean> {
    const products = await getCollection('products');
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await products.deleteOne({ _id: objectId });
    return result.deletedCount > 0;
  }

  static async getAllProducts(): Promise<Product[]> {
    const products = await getCollection('products');
    const result = await products.find({}).toArray();
    return result as Product[];
  }

  static async getProductsByOwner(ownerId: string | ObjectId): Promise<Product[]> {
    const products = await getCollection('products');
    const ownerObjectId = typeof ownerId === 'string' ? new ObjectId(ownerId) : ownerId;
    const result = await products.find({ owner: ownerObjectId }).toArray();
    return result as Product[];
  }

  static async getAvailableProducts(): Promise<Product[]> {
    const products = await getCollection('products');
    const result = await products.find({ availability: true }).toArray();
    return result as Product[];
  }
}
