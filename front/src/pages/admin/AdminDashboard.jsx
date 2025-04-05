import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const user = useSelector(state => state.user);
  const [stats, setStats] = useState({
    pendingImages: 0,
    totalUsers: 0,
    totalImages: 0,
    approvedImages: 0,
    engagement: {
      totalViews: 0,
      totalUniqueViews: 0,
      totalDownloads: 0,
      totalUniqueDownloads: 0,
      averageViews: 0,
      averageDownloads: 0,
      averageLikes: 0
    },
    mostViewedImages: [],
    mostLikedImages: [],
    mostDownloadedImages: [],
    visitors: {
      total: 0,
      today: 0,
      week: 0,
      trend: [],
      popularPaths: []
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch all stats from new endpoint
        const statsResponse = await fetch('/api/admin/stats', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          
          if (statsData.result) {
            setStats({
              pendingImages: statsData.data.images.pending || 0,
              totalUsers: statsData.data.users.total || 0,
              totalImages: statsData.data.images.total || 0,
              approvedImages: statsData.data.images.approved || 0,
              engagement: statsData.data.images.engagement || {
                totalViews: 0,
                totalUniqueViews: 0,
                totalDownloads: 0,
                totalUniqueDownloads: 0,
                averageViews: 0,
                averageDownloads: 0,
                averageLikes: 0
              },
              mostViewedImages: statsData.data.images.mostViewed || [],
              mostLikedImages: statsData.data.images.mostLiked || [],
              mostDownloadedImages: statsData.data.images.mostDownloaded || [],
              visitors: {
                total: statsData.data.visitors.total || 0,
                today: statsData.data.visitors.today || 0,
                week: statsData.data.visitors.week || 0,
                trend: statsData.data.visitors.trend || [],
                popularPaths: statsData.data.visitors.popularPaths || []
              }
            });
          }
        } else {
          console.error('Error fetching admin stats:', statsResponse.statusText);
          setError('Failed to load dashboard stats');
        }
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        setError('An error occurred while loading stats');
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

  // Format a number with commas (e.g. 1000 -> 1,000)
  const formatNumber = (num) => {
    return num?.toLocaleString() || '0';
  };

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
      
      {error && (
        <div className="alert alert-error mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      {/* Main Stats Cards */}
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
              <p className="text-accent-content/70 text-sm font-medium">Total Images</p>
              <h3 className="text-4xl font-bold text-accent-content/90 mt-2">{stats.totalImages}</h3>
            </div>
            <div className="bg-accent/20 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-base-content/60">
              <span className="font-medium text-success">{stats.approvedImages}</span> approved
            </span>
            <span className="text-base-content/60">
              <span className="font-medium text-warning">{stats.pendingImages}</span> pending
            </span>
          </div>
        </motion.div>
      </div>
      
      {/* Visitor Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-base-100 rounded-lg p-6 shadow-md mb-8"
      >
        <h2 className="text-xl font-semibold mb-4">Visitor Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-base-200 p-4 rounded-lg">
            <div className="flex justify-between">
              <h3 className="font-medium">Total Visitors</h3>
              <span className="text-info">All time</span>
            </div>
            <p className="text-3xl font-bold mt-2">{formatNumber(stats.visitors.total)}</p>
          </div>
          
          <div className="bg-base-200 p-4 rounded-lg">
            <div className="flex justify-between">
              <h3 className="font-medium">Today's Visitors</h3>
              <span className="text-success">
                {stats.visitors.today > 0 ? `${Math.floor((stats.visitors.today / stats.visitors.total) * 100)}%` : '0%'}
              </span>
            </div>
            <p className="text-3xl font-bold mt-2">{formatNumber(stats.visitors.today)}</p>
          </div>
          
          <div className="bg-base-200 p-4 rounded-lg">
            <div className="flex justify-between">
              <h3 className="font-medium">Weekly Visitors</h3>
              <span className="text-warning">
                {stats.visitors.week > 0 ? `${Math.floor((stats.visitors.week / stats.visitors.total) * 100)}%` : '0%'}
              </span>
            </div>
            <p className="text-3xl font-bold mt-2">{formatNumber(stats.visitors.week)}</p>
          </div>
        </div>
        
        {/* Daily Visitor Trend */}
        {stats.visitors.trend.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium mb-3">Daily Visitor Trend (Last 7 Days)</h3>
            <div className="bg-base-200 p-4 rounded-lg">
              <div className="flex h-40 items-end space-x-2">
                {stats.visitors.trend.map((day, index) => {
                  const maxCount = Math.max(...stats.visitors.trend.map(d => d.count));
                  const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                  return (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div 
                        className="bg-primary w-full rounded-t-sm" 
                        style={{ height: `${height}%`, minHeight: day.count > 0 ? '10%' : '0' }}
                      ></div>
                      <div className="text-xs mt-2 text-center">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="text-xs font-bold">{day.count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        {/* Popular Pages */}
        {stats.visitors.popularPaths.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium mb-3">Most Visited Pages</h3>
            <div className="overflow-x-auto">
              <table className="table table-sm w-full">
                <thead>
                  <tr>
                    <th>Page</th>
                    <th className="text-right">Views</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.visitors.popularPaths.map((path, index) => (
                    <tr key={index} className="hover">
                      <td>{path._id}</td>
                      <td className="text-right">{formatNumber(path.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
      
      {/* Image Engagement Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-base-100 rounded-lg p-6 shadow-md mb-8"
      >
        <h2 className="text-xl font-semibold mb-4">Image Engagement</h2>
        
        {/* Engagement Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-base-200 p-4 rounded-lg">
            <h3 className="font-medium text-sm">Total Views</h3>
            <p className="text-2xl font-bold mt-1">{formatNumber(stats.engagement.totalViews)}</p>
          </div>
          
          <div className="bg-base-200 p-4 rounded-lg">
            <h3 className="font-medium text-sm">Unique Views</h3>
            <p className="text-2xl font-bold mt-1">{formatNumber(stats.engagement.totalUniqueViews)}</p>
          </div>
          
          <div className="bg-base-200 p-4 rounded-lg">
            <h3 className="font-medium text-sm">Total Downloads</h3>
            <p className="text-2xl font-bold mt-1">{formatNumber(stats.engagement.totalDownloads)}</p>
          </div>
          
          <div className="bg-base-200 p-4 rounded-lg">
            <h3 className="font-medium text-sm">Unique Downloads</h3>
            <p className="text-2xl font-bold mt-1">{formatNumber(stats.engagement.totalUniqueDownloads)}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-base-200 p-4 rounded-lg">
            <h3 className="font-medium text-sm">Avg. Views Per Image</h3>
            <p className="text-2xl font-bold mt-1">{formatNumber(Math.round(stats.engagement.averageViews))}</p>
          </div>
          
          <div className="bg-base-200 p-4 rounded-lg">
            <h3 className="font-medium text-sm">Avg. Downloads Per Image</h3>
            <p className="text-2xl font-bold mt-1">{formatNumber(Math.round(stats.engagement.averageDownloads))}</p>
          </div>

          <div className="bg-base-200 p-4 rounded-lg">
            <h3 className="font-medium text-sm">Avg. Likes Per Image</h3>
            <p className="text-2xl font-bold mt-1">{formatNumber(Math.round(stats.engagement.averageLikes))}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Most Viewed Images */}
          {stats.mostViewedImages.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">Most Viewed Images</h3>
              <div className="overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th className="text-right">Views</th>
                      <th className="text-right">Unique</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.mostViewedImages.map((img, index) => (
                      <tr key={index} className="hover">
                        <td className="truncate max-w-[200px]">{img.title}</td>
                        <td className="text-right">{formatNumber(img.views?.total || 0)}</td>
                        <td className="text-right">{formatNumber(img.views?.unique || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Most Liked Images */}
          {stats.mostLikedImages.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">Most Liked Images</h3>
              <div className="overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th className="text-right">Likes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.mostLikedImages.map((img, index) => (
                      <tr key={index} className="hover">
                        <td className="truncate max-w-[200px]">{img.title}</td>
                        <td className="text-right">{formatNumber(img.likeCount || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        
        {/* Most Downloaded Images */}
        {stats.mostDownloadedImages.length > 0 && (
          <div>
            <h3 className="font-medium mb-3">Most Downloaded Images</h3>
            <div className="overflow-x-auto">
              <table className="table table-sm w-full">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th className="text-right">Downloads</th>
                    <th className="text-right">Unique</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.mostDownloadedImages.map((img, index) => (
                    <tr key={index} className="hover">
                      <td className="truncate max-w-[200px]">{img.title}</td>
                      <td className="text-right">{formatNumber(img.downloads?.total || 0)}</td>
                      <td className="text-right">{formatNumber(img.downloads?.unique || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
      
      {/* Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-base-100 rounded-lg p-6 shadow-md mb-8"
      >
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/admin/approvals" className="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Approve Images
          </Link>
          <Link to="/admin/users" className="btn btn-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Manage Users
          </Link>
          <Link to="/explore" className="btn btn-accent">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Browse Content
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard; 