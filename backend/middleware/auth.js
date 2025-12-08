import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Convert Sequelize instance to plain object for easier access
    // Ensure id is always included
    const userObj = user.toJSON ? user.toJSON() : (user.dataValues || user);
    
    // CRITICAL: Ensure id exists - use the Sequelize instance id if JSON doesn't have it
    if (!userObj.id) {
      if (user.id) {
        userObj.id = user.id;
      } else if (user.dataValues?.id) {
        userObj.id = user.dataValues.id;
      } else {
        console.error('CRITICAL: User object has no id field!', {
          userKeys: Object.keys(user),
          userObjKeys: Object.keys(userObj),
          hasToJSON: !!user.toJSON,
          hasDataValues: !!user.dataValues
        });
        return res.status(401).json({ message: 'User ID is missing. Please log in again.' });
      }
    }
    
    // Log for debugging
    console.log('Authentication successful:', {
      userId: userObj.id,
      userEmail: userObj.email,
      userRole: userObj.role,
      userObjKeys: Object.keys(userObj)
    });
    
    req.user = userObj;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

// Optional authentication - sets req.user if token exists, but doesn't fail if it doesn't
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);
        if (user) {
          req.user = user;
        }
      } catch (error) {
        // Invalid token, but continue without user
        req.user = null;
      }
    }
    next();
  } catch (error) {
    next();
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Flatten roles array in case it's nested (e.g., authorize(['admin']) becomes [['admin']])
    const flatRoles = roles.flat();
    
    if (!flatRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    next();
  };
};

