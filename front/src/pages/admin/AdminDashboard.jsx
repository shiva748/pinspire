import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const user = useSelector(state => state.user);
  const [stats, setStats] = useState({
    pendingImages: 0,
    totalUsers: 0,
    totalImages: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Fetch pending images count
        const pendingResponse = await fetch('/api/admin/pendingimage', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (pendingResponse.ok) {
          const pendingData = await pendingResponse.json();
          if (pendingData.data) {
            setStats(prev => ({
              ...prev,
              pendingImages: pendingData.data.length || 0
            }));
          }
        }
        
        // Fetch user count - using a general search to get all users
        const usersResponse = await fetch('/api/admin/getusers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username: '' }),
          credentials: 'include'
        });
        
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          if (usersData.result) {
            setStats(prev => ({
              ...prev,
              totalUsers: usersData.count || 0
            }));
          }
        }
        
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user.data.username}</p>
      </motion.div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-primary/10 rounded-lg p-6 shadow-md"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-primary-content/70 text-sm font-medium">Pending Approvals</p>
              <h3 className="text-4xl font-bold text-primary-content/90 mt-2">{stats.pendingImages}</h3>
            </div>
            <div className="bg-primary/20 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <Link to="/admin/approvals" className="mt-4 inline-block text-primary font-medium hover:underline">
            Review pending images →
          </Link>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-secondary/10 rounded-lg p-6 shadow-md"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-secondary-content/70 text-sm font-medium">Total Users</p>
              <h3 className="text-4xl font-bold text-secondary-content/90 mt-2">{stats.totalUsers}</h3>
            </div>
            <div className="bg-secondary/20 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <Link to="/admin/users" className="mt-4 inline-block text-secondary font-medium hover:underline">
            Manage users →
          </Link>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-accent/10 rounded-lg p-6 shadow-md"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-accent-content/70 text-sm font-medium">Quick Actions</p>
              <h3 className="text-xl font-bold text-accent-content/90 mt-2">Admin Controls</h3>
            </div>
            <div className="bg-accent/20 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link to="/admin/approvals" className="btn btn-sm btn-outline">
              Approve Images
            </Link>
            <Link to="/admin/users" className="btn btn-sm btn-outline">
              Manage Users
            </Link>
          </div>
        </motion.div>
      </div>
      
      {/* Quick Overview */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-base-100 rounded-lg p-6 shadow-md mb-8"
      >
        <h2 className="text-xl font-semibold mb-4">Admin Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Image Approval</h3>
            <p className="text-base-content/70 mb-3">
              Review and approve user-submitted images before they appear on the platform.
              You can approve, reject, or delete images as needed.
            </p>
            <Link to="/admin/approvals" className="btn btn-primary btn-sm">
              Go to Image Approvals
            </Link>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">User Management</h3>
            <p className="text-base-content/70 mb-3">
              Search for users, view their profiles, and manage their content.
              You can also monitor user activity across the platform.
            </p>
            <Link to="/admin/users" className="btn btn-secondary btn-sm">
              Go to User Management
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard; 