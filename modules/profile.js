const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require('./user');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const StudySession = require('./studySession');
const Habit = require('./habitSchema');
const Timer = require('./timerSchema');

const LEVELUPREQUIREMENT = 100;

// Middleware
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(express.static('public'));
router.use("/js", express.static("./webapp/public/js"));
router.use("/css", express.static("./webapp/public/css"));
router.use("/img", express.static("./webapp/public/img"));

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const studySessions = await StudySession.find({ email: req.user.email });
        let totalPoints = 0;
        studySessions.forEach(sesh => {
            totalPoints += sesh.duration / 5;
        });
        req.user.knowledgeAmount = totalPoints;
        await req.user.save();
        res.render('profile', { user: req.user});
    } catch (error) {
        console.error("Error fetching study sessions:", error);
        res.status(500).send("Internal server error");
    }
});

// Edit Profile route
router.get('/editProfile', ensureAuthenticated, (req, res) => {
    res.render('editProfile', { user: req.user });
});


router.post('/findDuplicate', ensureAuthenticated, async (req, res) => {
    try {
        const { username, email } = req.body;
        const existantUserName = await User.findOne({ username: username });
        if (existantUserName && existantUserName._id.toString() != req.user._id.toString()) {
            return res.json({ success: false, message: "Username already exists" });
        }
        const existantEmail = await User.findOne({ email: email });
        if (existantEmail && existantEmail._id.toString() != req.user._id.toString()) {
            return res.json({ success: false, message: "Email already exists" });
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Error checking duplicates:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

router.post('/editProfile', ensureAuthenticated, async (req, res) => {
    try {
        const { name, username, email } = req.body;
        const updatedUser = await User.findOneAndUpdate(
            { email: req.user.email },
            { $set: { email: email, name: name, username: username } },
            { new: true }
        );

        if (updatedUser) {
            res.json({ success: true, user: updatedUser });
        } else {
            res.status(404).json({ success: false, message: "User not found" });
        }
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

router.post('/profileElements', ensureAuthenticated, (req, res) => {
    const username = req.user.username;
    const name = req.user.name;
    const email = req.user.email;
    res.json({username: username, name: name, email: email});
});

router.post("/deleteUser", ensureAuthenticated, async (req, res) => {
    try{
        await Habit.deleteMany({email: req.user.email});
        await StudySession.deleteMany({email: req.user.email});
        await Timer.deleteOne({email: req.user.email});
        await User.deleteOne({email: req.user.email});
        return res.redirect('/');
    } catch (Error){
        return res.redirect('/');
    }
});

module.exports = router;