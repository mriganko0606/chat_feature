import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/database-services';
import { CreateProductData } from '@/lib/models';
import { ObjectId } from 'mongodb';

// GET /api/products/[productId] - Get a specific product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const product = await ProductService.getProductById(productId);
    
    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[productId] - Update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const body: Partial<CreateProductData> = await request.json();
    
    // Convert string ID to ObjectId if owner is being updated
    const updateData: Partial<CreateProductData> = {
      ...body,
      owner: body.owner ? (typeof body.owner === 'string' ? new ObjectId(body.owner) : body.owner) : undefined,
    };

    const product = await ProductService.updateProduct(productId, updateData);
    
    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[productId] - Delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const deleted = await ProductService.deleteProduct(productId);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
