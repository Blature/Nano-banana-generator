const User = require('../models/User');
const logger = require('../utils/logger');

async function checkAccess(telegramId) {
  try {
    const hasAccess = await User.hasAccess(telegramId);
    const isRootAdmin = await User.isRootAdmin(telegramId);
    
    return {
      hasAccess: hasAccess || isRootAdmin,
      isRootAdmin,
      isAdmin: await User.isAdmin(telegramId),
    };
  } catch (error) {
    logger.error('Error checking access:', error);
    return {
      hasAccess: false,
      isRootAdmin: false,
      isAdmin: false,
    };
  }
}

module.exports = {
  checkAccess,
};

