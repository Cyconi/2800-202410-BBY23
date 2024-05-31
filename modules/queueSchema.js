const mongoose = require("mongoose");

/**
 * Mongoose schema for Queue.
 * 
 * This schema defines the structure of the Queue document, which is used to manage a queue system for users.
 * It includes fields for the user's email, whether the user is in the queue, the timestamp of when the user 
 * entered the queue, and an optional list of hobbies.
 * 
 * @module models/Queue
 * @requires mongoose
 */
const queueSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    inQueue: { type: Boolean, required: true },
    time: { type: Date, unique: false, required: true },
    hobbies: { type: [String], required: false }
});

queueSchema.statics.getQueueCount = function () {
    return this.countDocuments({ inQueue: true });
};

const WaitQueue = mongoose.model('queue', queueSchema);

module.exports = WaitQueue;