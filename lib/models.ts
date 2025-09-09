import { ObjectId } from 'mongodb';

// User Schema Interface
export interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  pic: string;
  isAdmin: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Chat Schema Interface
export interface Chat {
  _id?: ObjectId;
  chatName: string;
  isGroupChat: boolean;
  users: ObjectId[];
  latestMessage?: ObjectId;
  groupAdmin?: ObjectId;
  unreadCount?: { [userId: string]: number };
  createdAt?: Date;
  updatedAt?: Date;
}

// Message Schema Interface
export interface Message {
  _id?: ObjectId;
  sender: ObjectId;
  content: string;
  chat: ObjectId;
  readBy: ObjectId[];
  imageUrl?: string;
  messageType: 'text' | 'image' | 'mixed';
  createdAt?: Date;
  updatedAt?: Date;
}

// Product Schema Interface
export interface Product {
  _id?: ObjectId;
  imgUrl: string;
  owner: ObjectId;
  description: string;
  availability: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// User creation data (without _id and timestamps)
export interface CreateUserData {
  name: string;
  email: string;
  pic?: string;
  isAdmin?: boolean;
}

// Chat creation data (without _id and timestamps)
export interface CreateChatData {
  chatName: string;
  isGroupChat?: boolean;
  users: ObjectId[];
  groupAdmin?: ObjectId;
}

// Message creation data (without _id and timestamps)
export interface CreateMessageData {
  sender: ObjectId;
  content: string;
  chat: ObjectId;
  readBy?: ObjectId[];
  imageUrl?: string;
  messageType?: 'text' | 'image' | 'mixed';
}

// Product creation data (without _id and timestamps)
export interface CreateProductData {
  imgUrl: string;
  owner: ObjectId;
  description: string;
  availability?: boolean;
}

// Helper function to create a new user document
export function createUserDocument(data: CreateUserData): Omit<User, '_id'> {
  return {
    name: data.name,
    email: data.email,
    pic: data.pic || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
    isAdmin: data.isAdmin || false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Helper function to create a new chat document
export function createChatDocument(data: CreateChatData): Omit<Chat, '_id'> {
  return {
    chatName: data.chatName,
    isGroupChat: data.isGroupChat || false,
    users: data.users,
    groupAdmin: data.groupAdmin,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Helper function to create a new message document
export function createMessageDocument(data: CreateMessageData): Omit<Message, '_id'> {
  return {
    sender: data.sender,
    content: data.content,
    chat: data.chat,
    readBy: data.readBy || [],
    imageUrl: data.imageUrl,
    messageType: data.messageType || 'text',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Helper function to create a new product document
export function createProductDocument(data: CreateProductData): Omit<Product, '_id'> {
  return {
    imgUrl: data.imgUrl,
    owner: data.owner,
    description: data.description,
    availability: data.availability !== undefined ? data.availability : true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
