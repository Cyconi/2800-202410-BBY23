const mongoose = require("mongoose");
const AutoIncrement = require('mongoose-sequence')(mongoose);

const habitSchema = new mongoose.Schema({
    email: { type: String, unique: false, required: true },
    good: {type: Boolean, unique: false, required: true},
    habit: { type: String, unique: false, required: true },
    dailyQuestion: { type: String, unique: false, required: true },
    frequency: { type: Number, required: true },
    normalizedHabit: {type: String, unique: false, required: true },
    normalizedQuestion: {type: String, unique: false, required: true },
    whenToAsk: {type: Date, unique: false, required: true},
    whenMade: {type: Date, unique: false, required: true}
});

habitSchema.plugin(AutoIncrement, { inc_field: 'id' });
const Habit = mongoose.model('Habit', habitSchema);

module.exports = Habit;
