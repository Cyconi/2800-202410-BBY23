const mongoose = require("mongoose");
const AutoIncrement = require('mongoose-sequence')(mongoose);

const habitSchema = new mongoose.Schema({
    email: { type: String, required: true },
    good: { type: Boolean, required: true },
    habit: { type: String, required: true },
    dailyQuestion: { type: String, required: true },
    frequency: { type: [Number], required: true, default: [] },
    normalizedHabit: { type: String, required: true },
    normalizedQuestion: { type: String, required: true },
    whenToAsk: { type: Date, required: true },
    whenMade: { type: Date, required: true }
});

habitSchema.plugin(AutoIncrement, { inc_field: 'id' });
const Habit = mongoose.model('Habit', habitSchema);

module.exports = Habit;
