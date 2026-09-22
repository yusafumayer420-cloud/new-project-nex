const Notification = require('../models/Notification');

/**
 * Creates a notification and emits it to all admins
 * @param {Object} io - Socket.io instance
 * @param {Object} data - Notification data { title, message, type, relatedId }
 */
const createAdminNotification = async (io, data) => {
  try {
    const notification = new Notification({
      title: data.title,
      message: data.message,
      type: data.type,
      relatedId: data.relatedId
    });

    await notification.save();

    if (io) {
      io.to('admin').emit('new_notification', notification);
    }

    return notification;
  } catch (error) {
    console.error('Error creating admin notification:', error);
  }
};

module.exports = {
  createAdminNotification
};
