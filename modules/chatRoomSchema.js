const mongoose = require("mongoose");

/**
 * Mongoose schema for Message.
 * 
 * This schema defines the structure of the Message document, which is used to store individual messages
 * in a chat system. It includes fields for the sender's identifier, the sender's email, the message content, 
 * and a timestamp for when the message was sent.
 * 
 */
const messageSchema = new mongoose.Schema({
    sender: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

/**
 * Mongoose schema for ChatRoom.
 * 
 * This schema defines the structure of the ChatRoom document, which is used to manage chat sessions between two users.
 * It includes fields for the identifiers of both users, their hobbies, the creation time of the chat room,
 * and an array of messages exchanged in the chat room.
 * 
 */
const chatRoomSchema = new mongoose.Schema({
    user1: { type: String, required: true },
    user2: { type: String, required: true },
    user1Hobbies: { type: [String], required: false },
    user2Hobbies: { type: [String], required: false }, 
    createdTime: { type: Date, default: Date.now },
    messages: [messageSchema] 
});

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

module.exports = ChatRoom;