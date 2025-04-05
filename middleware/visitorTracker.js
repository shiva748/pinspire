const Visitor = require('../database/Schema/visitor');

// Skip tracking for these paths
const EXCLUDED_PATHS = [
  '/api/admin', // Skip admin APIs
  '/favicon.ico',
  '/static/',
  '/assets/'
];

const shouldTrackPath = (path) => {
  return !EXCLUDED_PATHS.some(excludedPath => path.startsWith(excludedPath));
};

const visitorTracker = async (req, res, next) => {
  try {
    // Skip tracking for excluded paths
    if (!shouldTrackPath(req.path)) {
      return next();
    }

    // Get visitor info
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const path = req.originalUrl || req.url;
    
    // Optional: get user ID if logged in
    const userId = req.user?._id || null;
    
    // Create visitor record asynchronously - don't wait for it to complete
    Visitor.create({
      ip,
      userAgent,
      path,
      userId,
      timestamp: new Date()
    }).catch(err => {
      console.error('Error tracking visitor:', err);
    });
    
    // Continue with request processing
    next();
  } catch (error) {
    console.error('Error in visitor tracking middleware:', error);
    next(); // Continue even if tracking fails
  }
};

module.exports = visitorTracker; 