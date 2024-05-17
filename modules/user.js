const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {type: String, unique: true, reqired: true},
    name: { type: String, unique: false, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    resetPassword: {type: String, unique: false, required: false},
    resetPasswordDate: {type: Date, unique: false, required: false}
});

const User = mongoose.model('User', userSchema);

module.exports = User;
