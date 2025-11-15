"use client";

import { DashboardModal } from "@/components/dashboard-modal";
import { useState, useEffect } from "react";
import { User } from "@/lib/models";

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="h-screen w-screen overflow-hidden">
      {/* Full Screen Chat */}
      <DashboardModal 
        isOpen={true} 
        onClose={() => {}} // No-op function since we don't want to close
        selectedUser={selectedUser}
      />
    </div>
  );
}
