const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

/**
 * Mongoose schema for StudySession.
 * 
 * This schema defines the structure of the StudySession document, which is used to track study sessions for users.
 * It includes fields for the user's email, the subject of the study session, the duration of the session, any notes 
 * associated with the session, and the date of the session.
 * 
 * @module models/StudySession
 * @requires mongoose
 */
const studySessionSchema = new mongoose.Schema({
    email: {type: String, unique: false, required: true},
    subject: { type: String, unique: false, required: true },
    duration: { type: Number, unique: false, required: true },
    notes: { type: String, unique: false, required: false },
    date: {type: Date, unique: false, required: false, default: Date.now}
});

studySessionSchema.plugin(AutoIncrement, { inc_field: 'idSession' });
const StudySession = mongoose.model('studySession', studySessionSchema);

module.exports = StudySession;
