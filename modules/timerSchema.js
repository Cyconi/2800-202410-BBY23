const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

/**
 * Mongoose schema for Timer.
 * 
 * This schema defines the structure of the Timer document, which is used to track the timer status for users.
 * It includes fields for the user's email, the timer value, whether the timer is paused, and the current timestamp.
 * 
 * @module models/Time
 * @requires mongoose
 */
const timeSchema = new mongoose.Schema({
    email: {type: String, unique: true ,required: true},
    timer: {type: Number, unique: false, required: true},
    isPaused: {type: Boolean, unique: false, required: true},
    timeNow: { type: Date, default: Date.now }
});

const timerSchema = mongoose.model('timerSchema', timeSchema);

module.exports = timerSchema;