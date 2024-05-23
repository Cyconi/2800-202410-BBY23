const mongoose = require("mongoose");

const chatRoomSchema = new mongoose.Schema({
    user1: { type: String, required: true },
    user2: { type: String, required: true },
    // ... other chat room details
});

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

module.exports = ChatRoom;