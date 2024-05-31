const mongoose = require("mongoose");

const oneHourAgo = () => {
    const date = new Date();
    date.setHours(date.getHours() - 1);
    return date;
};

/**
 * Mongoose schema for User.
 * 
 * This schema defines the structure of the User document, including fields for username, name, email, password,
 * password reset tokens and dates, various user metrics (number of habits, knowledge amount, interpersonal amount, etc.),
 * and additional fields like security questions and answers, notification settings, and FAQ usage.
 * 
 */
const userSchema = new mongoose.Schema({
    username: {type: String, unique: true, required: true},
    name: { type: String, unique: false, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    resetPassword: {type: String, unique: false, required: false},
    resetPasswordDate: {type: Date, unique: false, required: false},
    numberOfHabits: {type: Number, unique: false, required: true, default: 0},
    knowledgeAmount: {type: Number, unique: false, required: true, default: 0},
    interpersonalAmount: {type: Number, unique: false, required: true, default: 0},
    interpersonalCompleted: {type: [Number], unique: false, required: true, default: [0, 0, 0, 0, 0, 0]},
    lastCheckedNotification: {type: Date, unique: false, required: true, default: oneHourAgo },
    openedNotification: {type: Boolean, unique: false, required: true, default: 0},
    habitAmount: {type: Number, unique: false, required: true, default: 0 },
    interpersonalCompleted: {type: [Number], unique: false, required: true, default: [0, 0, 0, 0, 0, 0]},
    securityQuestion: { type: String, unique: false, required: false },
    securityAnswer: { type: String, unique: false, required: false },
    faqUsed: {type: [Number], unique: false, required: true, default: [0, 0, 0, 0, 0, 0]}
});

const User = mongoose.model('User', userSchema);

module.exports = User;
