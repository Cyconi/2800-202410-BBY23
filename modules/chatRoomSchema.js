const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    sender: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const chatRoomSchema = new mongoose.Schema({
    user1: { type: String, required: true },
    user2: { type: String, required: true },
    user1Hobbies: { type: [String], required: false }, // new field for user1's hobbies
    user2Hobbies: { type: [String], required: false }, // new field for user2's hobbies
    createdTime: { type: Date, default: Date.now },
    messages: [messageSchema] // sub-collection of messages
});

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

module.exports = ChatRoom;