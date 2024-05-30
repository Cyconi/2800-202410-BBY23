const mongoose = require("mongoose");

const queueSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    inQueue: { type: Boolean, required: true },
    time: { type: Date, unique: false, required: true },
    hobbies: { type: [String], required: false } // new field for hobbies
});

queueSchema.statics.getQueueCount = function () {
    return this.countDocuments({ inQueue: true });
};

const WaitQueue = mongoose.model('queue', queueSchema);

module.exports = WaitQueue;