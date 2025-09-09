"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle, ShoppingBag, Star, MapPin, Calendar } from "lucide-react";
import { DashboardModal } from "@/components/dashboard-modal";
import { useState, useEffect } from "react";
import { User, Product, Chat } from "@/lib/models";
import { useRouter } from "next/navigation";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productToShare, setProductToShare] = useState<Product | null>(null);
  const router = useRouter();

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        const data = await response.json();
        if (data.success) {
          setUsers(data.users);
          // Set first user as default if none selected
          if (data.users.length > 0 && !selectedUser) {
            setSelectedUser(data.users[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [selectedUser]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        const data = await response.json();
        if (data.success) {
          setProducts(data.products);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Fetch total unread count for selected user
  useEffect(() => {
    if (!selectedUser) return;

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch(`/api/chats/unread?userId=${selectedUser._id}`);
        const data = await response.json();
        if (data.success) {
          const total = data.chats.reduce((sum: number, chat: Chat) => {
            return sum + (chat.unreadCount?.[selectedUser._id?.toString() || ''] || 0);
          }, 0);
          setTotalUnreadCount(total);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    
    // Refresh unread count every 5 seconds
    const interval = setInterval(fetchUnreadCount, 5000);
    return () => clearInterval(interval);
  }, [selectedUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Product Marketplace</h1>
            </div>
            
            {/* User Selection */}
            <div className="flex items-center gap-4">
              {loading ? (
                <div className="text-sm text-gray-500">Loading users...</div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Switch User:</span>
                  <select
                    value={selectedUser?._id?.toString() || ''}
                    onChange={(e) => {
                      const user = users.find(u => u._id?.toString() === e.target.value);
                      if (user) {
                        setSelectedUser(user);
                        router.push(`/dashboard?userId=${user._id}`);
                      }
                    }}
                    className="px-3 py-1 border rounded-lg text-sm bg-white dark:bg-gray-700"
                  >
                    <option value="">Select User</option>
                    {users.map((user) => (
                      <option key={user._id?.toString()} value={user._id?.toString()}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Products Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Featured Products</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Calendar className="h-4 w-4" />
              <span>Updated just now</span>
            </div>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6 animate-pulse">
                  <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No products found</h3>
              <p className="text-gray-500 dark:text-gray-400">Be the first to add a product to the marketplace!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={product._id?.toString()}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border hover:shadow-lg transition-all duration-300 overflow-hidden group"
                >
                  {/* Product Image */}
                  <div className="relative h-48 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <img
                      src={product.imgUrl}
                      alt={product.description}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image';
                      }}
                    />
                    {/* Availability Badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.availability
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {product.availability ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
                          {product.description}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                          <MapPin className="h-3 w-3" />
                          <span>Owner: {product.owner?.toString().slice(-6)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={!product.availability}
                      >
                        {product.availability ? 'View Details' : 'Unavailable'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="px-3"
                        disabled={!product.availability}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="px-3"
                        onClick={() => {
                          if (selectedUser) {
                            setIsModalOpen(true);
                            // Store the product to be shared
                            setProductToShare(product);
                          } else {
                            alert('Please select a user first');
                          }
                        }}
                        disabled={!product.availability || !selectedUser}
                        title="Chat with owner"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Chat Button - Fixed position in lower right corner */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-500 hover:bg-blue-600 relative"
          size="icon"
          onClick={() => setIsModalOpen(true)}
        >
          <MessageCircle className="h-6 w-6" />
          <span className="sr-only">Open Chat</span>
          {totalUnreadCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </div>
          )}
        </Button>
      </div>

      {/* Dashboard Modal */}
      <DashboardModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setProductToShare(null);
        }}
        selectedUser={selectedUser}
        productToShare={productToShare}
        onUserChange={(user) => {
          setSelectedUser(user);
          router.push(`/dashboard?userId=${user._id}`);
        }}
      />
    </div>
  );
}
