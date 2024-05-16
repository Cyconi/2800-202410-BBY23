const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const studySessionSchema = new mongoose.Schema({
    email: {type: String, unique: false, required: true},
    subject: { type: String, unique: false, required: true },
    duration: { type: Number, unique: false, required: true },
    notes: { type: String, unique: false, required: false },
    date: {type: Date, unique: false, required: false, default: Date.now}
});

studySessionSchema.plugin(AutoIncrement, { inc_field: 'id' });
const StudySession = mongoose.model('studySession', studySessionSchema);

module.exports = StudySession;
