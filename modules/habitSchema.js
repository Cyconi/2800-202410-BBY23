const mongoose = require("mongoose");
const AutoIncrement = require('mongoose-sequence')(mongoose);

/**
 * Mongoose schema and model for Habits.
 * 
 * This schema defines the structure of the Habit document, including fields for email as a foreign key, whether the habit is good,
 * the habit name, a daily question, a frequency array, normalized versions of the habit name and question, 
 * and timestamps for when the habit should be prompted and when it was created. Finally it includes an auto-incrementing id for
 * easier id queries.
 * 
 * @module models/Habit
 */
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
