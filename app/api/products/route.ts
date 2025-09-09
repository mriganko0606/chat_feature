import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/database-services';
import { CreateProductData } from '@/lib/models';
import { ObjectId } from 'mongodb';

// GET /api/products - Get all products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');
    const available = searchParams.get('available');

    let products;
    if (ownerId) {
      products = await ProductService.getProductsByOwner(ownerId);
    } else if (available === 'true') {
      products = await ProductService.getAvailableProducts();
    } else {
      products = await ProductService.getAllProducts();
    }

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const body: CreateProductData = await request.json();
    
    // Validate required fields
    if (!body.imgUrl || !body.owner || !body.description) {
      return NextResponse.json(
        { success: false, message: 'Image URL, owner, and description are required' },
        { status: 400 }
      );
    }

    // Convert string ID to ObjectId
    const productData: CreateProductData = {
      ...body,
      owner: typeof body.owner === 'string' ? new ObjectId(body.owner) : body.owner,
    };

    const product = await ProductService.createProduct(productData);
    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create product' },
      { status: 500 }
    );
  }
}
