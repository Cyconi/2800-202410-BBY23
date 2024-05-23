const mongoose = require("mongoose");

const oneHourAgo = () => {
    const date = new Date();
    date.setHours(date.getHours() - 1);
    return date;
};

const userSchema = new mongoose.Schema({
    username: {type: String, unique: true, required: true},
    name: { type: String, unique: false, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    resetPassword: {type: String, unique: false, required: false},
    resetPasswordDate: {type: Date, unique: false, required: false},
    numberOfHabits: {type: Number, unique: false, required: true, default: 0},
    knowledgeAmount: {type: Number, unique: false, required: true, default: 0},
    numberOfHabits: {type: Number, unique: false, required: true, default: 0},
    interpersonalAmount: {type: Number, unique: false, required: true, default: 0},
    interpersonalCompleted: {type: [Number], unique: false, required: true, default: [0, 0, 0, 0, 0, 0]},
    lastCheckedNotification: {type: Date, unique: false, required: true, default: oneHourAgo },
    habitAmount: {type: Number, unique: false, required: true, default: 100 }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
