const ChatMessage = require('../models/Chat');
const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');
const DepositAddress = require('../models/DepositAddress');
const { createAdminNotification } = require('../utils/notificationHelper');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Dynamically fetch FAQ reply from the database
async function getFAQReply(userMessage) {
  const lower = userMessage.toLowerCase().trim();

  // Fetch active deposit addresses from DB
  const addresses = await DepositAddress.find({ isActive: true });

  if (!addresses || addresses.length === 0) {
    return null;
  }

  const formatReply = (entry) =>
    `Deposit Address Details\n\nAsset: ${entry.coin}\nNetwork: ${entry.network}\nDeposit Address:\n${entry.walletAddress}\n\n⚠️ Important: Please ensure that you select the ${entry.network} network when making your deposit. Sending ${entry.coin} through an unsupported or incorrect network may result in the permanent loss of your funds.\n\nAfter completing your deposit, please upload a screenshot or proof of the transaction in the Deposit section of the Fund page. This will help us verify and process your deposit.`;

  let matchedAddresses = [];

  for (const entry of addresses) {
    let isMatched = false;

    // Check keywords only (ignore coin name unless it's in keywords)
    if (Array.isArray(entry.keywords) && entry.keywords.length > 0) {
      isMatched = entry.keywords.some(kw => {
        const cleanedKw = kw.toLowerCase().trim();
        return cleanedKw && cleanedKw.length > 0 && lower === cleanedKw;
      });
    }

    if (isMatched) {
      matchedAddresses.push(entry);
    }
  }

  if (matchedAddresses.length > 0) {
    return { type: 'text', content: matchedAddresses.map(formatReply).join('\n\n-------------------\n\n') };
  }

  // ── Generic deposit address question detection ───────────────
  // If user asks a generic question about deposit address (no specific coin matched),
  // reply with a selection menu showing all available coins.
  // Changed per user request to ONLY reply for the suggestion chip exact text
  const isGenericDepositQuestion = lower === 'what is the deposit address?';

  if (isGenericDepositQuestion && addresses.length > 0) {
    // Build options list from active deposit addresses
    const options = addresses.map(entry => ({
      coin: entry.coin,
      network: entry.network,
      label: `${entry.coin} (${entry.network})`,
      // The keyword the user should send to get the specific address
      keyword: (Array.isArray(entry.keywords) && entry.keywords.length > 0)
        ? entry.keywords[0]
        : `${entry.coin.toLowerCase()} deposit address`
    }));

    return {
      type: 'bot_crypto_selection',
      content: '__BOT_SELECTION__:' + JSON.stringify({
        prompt: 'Please select the cryptocurrency you want to deposit:',
        options
      })
    };
  }

  return null; // Let human support handle it
}

module.exports = (io) => {
  const chatNamespace = io.of('/chat');
  
  // Store active admin connections
  const activeAdmins = new Map();
  // Store active user connections (socket.id -> { userId, ip, online })
  const activeUsers = new Map();
  // Store user rooms
  const userRooms = new Map();
  
  chatNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }
      const payload = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(payload.id);
      if (!user) {
        return next(new Error('User not found'));
      }
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });
  
  chatNamespace.on('connection', async (socket) => {
    console.log(`Chat connected: ${socket.user._id} (${socket.user.email})`);
    
    const userId = socket.user._id.toString();
    const userRoom = `user_${userId}`;
    const adminRoom = 'admin_room';
    // Join user's personal room and track status
    socket.join(userRoom);
    userRooms.set(userId, userRoom);
    // Add user to activeUsers map for status tracking
    activeUsers.set(socket.id, {
      userId: userId,
      ip: socket.handshake.headers['x-forwarded-for']?.split(',')[0].trim() || socket.handshake.address || socket.request?.connection?.remoteAddress || '',
      online: true
    });
    
    try {
      await User.findByIdAndUpdate(userId, { 
        lastIpAddress: socket.handshake.headers['x-forwarded-for']?.split(',')[0].trim() || socket.handshake.address || socket.request?.connection?.remoteAddress || ''
      });
    } catch (err) {
      console.error('Error updating lastIpAddress:', err);
    }
      // Notify admins of new user status
      const statusList = [];
      for (const [sockId, info] of activeUsers.entries()) {
        const usr = await User.findById(info.userId).select('email fullName');
        statusList.push({
          socketId: sockId,
          userId: info.userId,
          email: usr?.email,
          name: usr?.fullName,
          ip: info.ip,
          online: info.online
        });
      }
      chatNamespace.to(adminRoom).emit('user_status', statusList);    
    // If user is admin, join admin room
    if (socket.user.role === 'admin') {
      socket.join(adminRoom);
      activeAdmins.set(userId, socket.id);

      // Send the current user status list directly to this admin immediately
      const currentStatusList = [];
      for (const [sockId, info] of activeUsers.entries()) {
        currentStatusList.push({ socketId: sockId, userId: info.userId, ip: info.ip, online: info.online });
      }
      socket.emit('user_status', currentStatusList);

      // Notify all admins that an admin joined
      chatNamespace.to(adminRoom).emit('admin_status', {
        adminId: userId,
        online: true,
        totalOnline: activeAdmins.size
      });
    }

    // Handle admin requesting the current user status list on demand
    socket.on('get_user_status', async () => {
      if (socket.user.role !== 'admin') return;
      const statusList = [];
      for (const [sockId, info] of activeUsers.entries()) {
        statusList.push({ socketId: sockId, userId: info.userId, ip: info.ip, online: info.online });
      }
      socket.emit('user_status', statusList);
    });
    
    // Send online admin count to user
    chatNamespace.to(userRoom).emit('online_admins', {
      count: activeAdmins.size,
      status: activeAdmins.size > 0 ? 'available' : 'unavailable'
    });
    
    // Send chat history
    let messages = await ChatMessage.find({
      $or: [
        { userId: socket.user._id },
        { room: 'general' },
        { type: 'admin', room: userRoom }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('userId', 'email fullName role profilePicture');
    
    messages = messages.reverse();
    
    socket.emit('chat_history', messages);
    
    // Get user's open tickets
    const tickets = await SupportTicket.find({ 
      userId: socket.user._id,
      status: { $in: ['open', 'in_progress'] }
    }).sort({ updatedAt: -1 });
    
    socket.emit('tickets', tickets);
    
    // Handle incoming messages
    socket.on('send_message', async (data) => {
      try {
        const { message, ticketId, attachments } = data;
        
        
        // 1. Get or Create Ticket
        let ticket;
        if (ticketId) {
          ticket = await SupportTicket.findById(ticketId);
        } else {
          // Find any existing open or in_progress ticket for this user so we don't spam tickets
          ticket = await SupportTicket.findOne({
            userId: socket.user._id,
            status: { $in: ['open', 'in_progress'] }
          }).sort({ updatedAt: -1 });
          
          if (!ticket) {
            // Create new ticket for user messages
            ticket = new SupportTicket({
              userId: socket.user._id,
              subject: 'Chat Support - ' + new Date().toLocaleDateString(),
              category: 'other',
              priority: 'medium',
              status: 'open',
              lastMessage: message.substring(0, 100),
              lastMessageAt: new Date()
            });
            await ticket.save();
            
            // Notify admins of new ticket
            chatNamespace.to('admin_room').emit('new_ticket', {
              _id: ticket._id,
              ticketId: ticket._id,
              ticketNumber: ticket.ticketId,
              subject: ticket.subject,
              category: ticket.category,
              priority: ticket.priority,
              userName: socket.user.fullName || socket.user.email,
              userId: socket.user._id,
              status: ticket.status,
              createdAt: ticket.createdAt,
              updatedAt: ticket.updatedAt
            });
          }
        }

        // 2. Determine target room (user's room)
        let targetRoom = userRoom;
        if (socket.user.role === 'admin' && ticket) {
          targetRoom = `user_${ticket.userId}`;
        }
        
        console.log('Sending message:', {
          role: socket.user.role,
          ticketId,
          ticketUserId: ticket?.userId,
          targetRoom,
          userRoom
        });

        // 3. Create chat message
        const chatMessage = new ChatMessage({
          userId: socket.user._id,
          message,
          type: socket.user.role === 'admin' ? 'admin' : 'user',
          room: targetRoom,
          attachments: attachments || [],
          metadata: {
            userAgent: socket.handshake.headers['user-agent'],
            ip: socket.handshake.address
          }
        });
        
        await chatMessage.save();
        
        // Populate user info
        await chatMessage.populate('userId', 'email fullName role profilePicture');
        
        // 4. Update ticket
        if (ticket) {
          ticket.messages.push(chatMessage._id);
          ticket.lastMessage = message.substring(0, 100);
          ticket.lastMessageAt = new Date();
          
          if (socket.user.role === 'admin') {
             ticket.status = 'in_progress';
             if (!ticket.assignedTo) ticket.assignedTo = socket.user._id;
          } else {
             ticket.status = 'open';
          }
          await ticket.save();
        }
        
        // 5. Emit to user (target room)
        chatNamespace.to(targetRoom).emit('receive_message', {
          ...chatMessage.toObject(),
          ticketId: ticket?._id
        });
        
        // 6. Emit to admins
        if (socket.user.role !== 'admin') {
          chatNamespace.to(adminRoom).emit('receive_message', {
            ...chatMessage.toObject(),
            ticketId: ticket?._id
          });
          
          chatNamespace.to(adminRoom).emit('notification', {
            type: 'new_message',
            userId: socket.user._id,
            userName: socket.user.fullName || socket.user.email,
            message: message.substring(0, 50),
            ticketId: ticket?._id,
            timestamp: new Date()
          });

          // Also create a persistent notification in the database
          await createAdminNotification(io, {
            type: 'support',
            title: 'New Support Message',
            message: `${socket.user.fullName || socket.user.email}: ${message.substring(0, 50)}`,
            relatedId: ticket?._id
          });
        } else {
           chatNamespace.to(adminRoom).emit('receive_message', {
            ...chatMessage.toObject(),
            ticketId: ticket?._id
          });
        }

        // ── FAQ Bot Auto-Reply ──────────────────────────────────
        if (socket.user.role !== 'admin') {
          const botReply = await getFAQReply(message);

          if (botReply) {
            // Find or create a system bot user (fallback: use first admin)
            let botUser = await User.findOne({ role: 'admin' }).select('_id email fullName role profilePicture');

            // botReply is now an object: { type, content }
            const replyText = typeof botReply === 'object' ? botReply.content : botReply;

            const botMessage = new ChatMessage({
              userId: botUser ? botUser._id : socket.user._id,
              message: replyText,
              type: 'admin',
              room: targetRoom,
              attachments: []
            });
            await botMessage.save();
            await botMessage.populate('userId', 'email fullName role profilePicture');

            if (ticket) {
              ticket.messages.push(botMessage._id);
              ticket.lastMessage = replyText.substring(0, 100);
              ticket.lastMessageAt = new Date();
              await ticket.save();
            }

            // Small delay so it feels like a real reply
            setTimeout(() => {
              chatNamespace.to(targetRoom).emit('receive_message', {
                ...botMessage.toObject(),
                ticketId: ticket?._id
              });
              chatNamespace.to(adminRoom).emit('receive_message', {
                ...botMessage.toObject(),
                ticketId: ticket?._id
              });
            }, 600);
          }
        }
        // ────────────────────────────────────────────────────────
        
      } catch (error) {
        console.error('Message send error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Handle typing indicator
    socket.on('typing', (data) => {
      const { isTyping, ticketId } = data;
      
      if (socket.user.role === 'admin') {
        // Admin typing to user
        chatNamespace.to(userRoom).emit('typing', {
          isTyping,
          from: 'admin',
          ticketId
        });
      } else {
        // User typing to admins
        chatNamespace.to(adminRoom).emit('typing', {
          isTyping,
          from: 'user',
          userId: socket.user._id,
          userName: socket.user.fullName || socket.user.email,
          ticketId
        });
      }
    });

    // Admin request for current user status
    socket.on('get_user_status', async () => {
      if (socket.user.role !== 'admin') return;
      const statusList = [];
      for (const [sockId, info] of activeUsers.entries()) {
        const user = await User.findById(info.userId).select('email fullName');
        statusList.push({
          socketId: sockId,
          userId: info.userId,
          email: user?.email,
          name: user?.fullName,
          ip: info.ip,
          online: info.online
        });
      }
      chatNamespace.to(adminRoom).emit('user_status', statusList);
    });
    
    // Handle read receipts
    socket.on('mark_read', async (messageId) => {
      try {
        await ChatMessage.findByIdAndUpdate(messageId, { isRead: true });
        
        if (socket.user.role === 'admin') {
          // Notify user that admin read their message
          chatNamespace.to(userRoom).emit('message_read', { messageId });
        }
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    socket.on('mark_all_read', async (data) => {
      try {
        let targetRoom;
        if (socket.user.role === 'admin') {
          // Admin is reading messages from a user — derive room from userId
          if (data.userId) {
            targetRoom = `user_${data.userId}`;
          } else if (data.ticketId) {
            const ticket = await SupportTicket.findById(data.ticketId).select('userId');
            if (ticket) targetRoom = `user_${ticket.userId}`;
          }
        } else {
          // User reading admin messages in their own room
          targetRoom = userRoom;
        }

        if (!targetRoom) return;

        // Mark all messages in that room sent by the OTHER party as read
        const result = await ChatMessage.updateMany(
          { room: targetRoom, userId: { $ne: socket.user._id }, isRead: false },
          { isRead: true }
        );

        // Notify the user room that their messages were seen
        chatNamespace.to(targetRoom).emit('all_messages_read', { room: targetRoom, seenBy: 'admin' });

        // Send updated unread count to the admin room for all tickets
        if (socket.user.role === 'admin') {
          // Calculate total unread user messages so admin badge can update
          const unreadCount = await ChatMessage.countDocuments({ type: 'user', isRead: false });
          chatNamespace.to(adminRoom).emit('unread_count_update', { room: targetRoom, unreadCount });
        }
      } catch (error) {
        console.error('Mark all read error:', error);
      }
    });

    // Admin requests unread count per user room
    socket.on('get_unread_counts', async () => {
      if (socket.user.role !== 'admin') return;
      try {
        // Aggregate unread user messages grouped by room
        const unreadByRoom = await ChatMessage.aggregate([
          { $match: { type: 'user', isRead: false } },
          { $group: { _id: '$room', count: { $sum: 1 } } }
        ]);
        const map = {};
        unreadByRoom.forEach(r => { map[r._id] = r.count; });
        socket.emit('unread_counts', map);
      } catch (error) {
        console.error('Get unread counts error:', error);
      }
    });
    
    // Handle ticket creation
    socket.on('create_ticket', async (data) => {
      try {
        const { subject, category, priority, message } = data;
        
        const ticket = new SupportTicket({
          userId: socket.user._id,
          subject,
          category,
          priority,
          status: 'open',
          lastMessage: message?.substring(0, 100) || subject
        });
        
        await ticket.save();
        
        // If there's an initial message, create it
        if (message) {
          const chatMessage = new ChatMessage({
            userId: socket.user._id,
            message,
            type: 'user',
            room: userRoom
          });
          
          await chatMessage.save();
          ticket.messages.push(chatMessage._id);
          await ticket.save();
          
          await chatMessage.populate('userId', 'email fullName role profilePicture');
          
          // Emit to user and admins
          chatNamespace.to(userRoom).emit('receive_message', {
            ...chatMessage.toObject(),
            ticketId: ticket._id
          });
          
          chatNamespace.to(adminRoom).emit('receive_message', {
            ...chatMessage.toObject(),
            ticketId: ticket._id
          });
        }
        
        socket.emit('ticket_created', ticket);
        
        // Notify admins
        chatNamespace.to(adminRoom).emit('new_ticket', {
          ticketId: ticket._id,
          ticketNumber: ticket.ticketId,
          subject,
          category,
          priority,
          userName: socket.user.fullName || socket.user.email,
          userId: socket.user._id,
          timestamp: new Date()
        });

        // Also create a persistent notification in the database
        await createAdminNotification(io, {
          type: 'support',
          title: 'New Support Ticket',
          message: `${socket.user.fullName || socket.user.email}: ${subject}`,
          relatedId: ticket._id
        });
        
      } catch (error) {
        console.error('Create ticket error:', error);
        socket.emit('error', { message: 'Failed to create ticket' });
      }
    });
    
    // Handle admin actions
    if (socket.user.role === 'admin') {
      // Get all tickets
      socket.on('get_all_tickets', async (filters = {}) => {
        try {
          const query = {};
          
          if (filters.status) query.status = filters.status;
          if (filters.category) query.category = filters.category;
          if (filters.priority) query.priority = filters.priority;
          
          const tickets = await SupportTicket.find(query)
            .populate('userId', 'email fullName role kycStatus profilePicture')
            .populate('assignedTo', 'email fullName')
            .sort({ updatedAt: -1 })
            .limit(100);
          
          socket.emit('all_tickets', tickets);
        } catch (error) {
          console.error('Get tickets error:', error);
        }
      });
      
      // Assign ticket to admin
      socket.on('assign_ticket', async (data) => {
        try {
          const { ticketId } = data;
          
          const ticket = await SupportTicket.findById(ticketId);
          if (ticket) {
            ticket.assignedTo = socket.user._id;
            ticket.status = 'in_progress';
            await ticket.save();
            
            // Notify assigned admin
            socket.emit('ticket_assigned', ticket);
            
            // Notify user
            chatNamespace.to(`user_${ticket.userId}`).emit('ticket_updated', {
              ticketId,
              status: ticket.status,
              assignedTo: socket.user._id
            });
          }
        } catch (error) {
          console.error('Assign ticket error:', error);
        }
      });
      
      // Resolve ticket
      socket.on('resolve_ticket', async (data) => {
        try {
          const { ticketId, resolutionNote } = data;
          
          const ticket = await SupportTicket.findById(ticketId);
          if (ticket) {
            ticket.status = 'resolved';
            ticket.resolution = {
              note: resolutionNote,
              resolvedBy: socket.user._id,
              resolvedAt: new Date()
            };
            await ticket.save();
            
            // Notify user
            chatNamespace.to(`user_${ticket.userId}`).emit('ticket_updated', {
              ticketId,
              status: ticket.status,
              resolution: ticket.resolution
            });
            
            socket.emit('ticket_resolved', ticket);
          }
        } catch (error) {
          console.error('Resolve ticket error:', error);
        }
      });

      // Mark ticket as seen
      socket.on('mark_ticket_seen', async (data) => {
        try {
          const { ticketId } = data;
          
          const ticket = await SupportTicket.findById(ticketId);
          if (ticket) {
            ticket.status = 'seen';
            await ticket.save();
            
            // Notify user
            chatNamespace.to(`user_${ticket.userId}`).emit('ticket_updated', {
              ticketId,
              status: ticket.status
            });
            
            // Re-emit ticket so UI updates
            socket.emit('ticket_seen', ticket);
          }
        } catch (error) {
          console.error('Mark ticket seen error:', error);
        }
      });

      // Mark ticket as in progress
      socket.on('mark_ticket_in_progress', async (data) => {
        try {
          const { ticketId } = data;
          const ticket = await SupportTicket.findById(ticketId);
          if (ticket) {
            ticket.status = 'in_progress';
            await ticket.save();
            
            chatNamespace.to(`user_${ticket.userId}`).emit('ticket_updated', {
              ticketId,
              status: ticket.status
            });
            
            socket.emit('ticket_in_progress', ticket);
          }
        } catch (error) {
          console.error('Mark ticket in progress error:', error);
        }
      });

      // Close ticket
      socket.on('close_ticket', async (data) => {
        try {
          const { ticketId } = data;
          const ticket = await SupportTicket.findById(ticketId);
          if (ticket) {
            ticket.status = 'closed';
            await ticket.save();
            
            chatNamespace.to(`user_${ticket.userId}`).emit('ticket_updated', {
              ticketId,
              status: ticket.status
            });
            
            socket.emit('ticket_closed', ticket);
          }
        } catch (error) {
          console.error('Close ticket error:', error);
        }
      });

      socket.on('edit_message', async (data) => {
        try {
          const { messageId, newMessage } = data;
          const message = await ChatMessage.findById(messageId);
          if (message && message.type === 'admin' && message.userId.toString() === socket.user._id.toString()) {
            message.message = newMessage;
            message.isEdited = true;
            await message.save();

            chatNamespace.to('admin_room').emit('message_edited', { messageId, newMessage, isEdited: true });
            if (message.room !== 'admin_room') {
              chatNamespace.to(message.room).emit('message_edited', { messageId, newMessage, isEdited: true });
            }
          }
        } catch (error) {
          console.error('Edit message error:', error);
        }
      });

      socket.on('delete_message', async (data) => {
        try {
          const { messageId } = data;
          const message = await ChatMessage.findById(messageId);
          if (message && message.type === 'admin' && message.userId.toString() === socket.user._id.toString()) {
            message.isDeleted = true;
            message.message = "This message was deleted";
            await message.save();

            chatNamespace.to('admin_room').emit('message_deleted', { messageId });
            if (message.room !== 'admin_room') {
              chatNamespace.to(message.room).emit('message_deleted', { messageId });
            }
          }
        } catch (error) {
          console.error('Delete message error:', error);
        }
      });
    }
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Chat disconnected: ${socket.user._id}`);
      
      if (socket.user.role === 'admin') {
        activeAdmins.delete(userId);
        // Notify other admins about admin status change
        chatNamespace.to(adminRoom).emit('admin_status', {
          adminId: userId,
          online: false,
          totalOnline: activeAdmins.size
        });
      } else {
        // Update user status to offline
        const info = activeUsers.get(socket.id);
        if (info) {
          info.online = false;
          activeUsers.set(socket.id, info);
        }
      }
      
      // Remove room mappings
      userRooms.delete(userId);
      activeUsers.delete(socket.id);

      // Broadcast updated user status to admins
      const statusList = [];
      for (const [sockId, info] of activeUsers.entries()) {
        // Retrieve minimal user info synchronously is not possible here; skip details
        statusList.push({ socketId: sockId, userId: info.userId, ip: info.ip, online: info.online });
      }
      chatNamespace.to(adminRoom).emit('user_status', statusList);

      // Update online admin count for all users
      chatNamespace.emit('online_admins', {
        count: activeAdmins.size,
        status: activeAdmins.size > 0 ? 'available' : 'unavailable'
      });
    });
  });
  
  return chatNamespace;
};