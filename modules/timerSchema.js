const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const timeSchema = new mongoose.Schema({
    email: {type: String, unique: true ,required: true},
    timer: {type: Number, unique: false, required: true},
    isPaused: {type: Boolean, unique: false, required: true}
});

const timerSchema = mongoose.model('timerSchema', timeSchema);

module.exports = timerSchema;