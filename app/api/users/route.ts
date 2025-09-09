import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/database-services';
import { CreateUserData } from '@/lib/models';

// GET /api/users - Get all users
export async function GET() {
  try {
    const users = await UserService.getAllUsers();
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body: CreateUserData = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { success: false, message: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await UserService.getUserByEmail(body.email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const user = await UserService.createUser(body);
    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create user' },
      { status: 500 }
    );
  }
}
