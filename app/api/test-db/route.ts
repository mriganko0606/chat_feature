import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    
    // Test the connection by pinging the database
    await db.admin().ping();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connected successfully!',
      database: db.databaseName 
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to connect to database',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
