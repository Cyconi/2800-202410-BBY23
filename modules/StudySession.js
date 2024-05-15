const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
    subject: String,
    duration: Number,
    notes: String,
    date: { type: Date, default: Date.now }
});

const StudySession = mongoose.model('StudySession', studySessionSchema);

module.exports = StudySession;
