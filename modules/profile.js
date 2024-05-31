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

/**
 * Handles the GET request to the home page, ensuring the user is authenticated.
 * 
 * This endpoint retrieves all study sessions for the authenticated user, calculates the total points 
 * based on the duration of each session (1 point for every 5 minutes), updates the user's knowledge amount,
 * and saves the updated user information. It then renders the 'profile' view with the updated user information.
 * If an error occurs during the process, it logs the error and responds with an internal server error message.
 * 
 * @route GET /profile
 * @middleware ensureAuthenticated - Middleware to ensure the user is authenticated before accessing this route.
 * @returns {Object} 200 - Renders the 'profile' view with the updated user information.
 * @returns {Object} 500 - Sends an error message if there is an internal server error.
 */
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

router.get('/editProfile', ensureAuthenticated, (req, res) => {
    res.render('editProfile', { user: req.user });
});

/**
 * Handles the POST request to check for duplicate usernames or emails for the authenticated user.
 * 
 * This post checks if the provided username or email already exists in the database for a user other than 
 * the authenticated user. If a duplicate is found, it returns an appropriate error message. If no duplicates are 
 * found, it returns a success message. If an error occurs during the process, it logs the error and responds with 
 * a server error message.
 * 
 * @route POST /profile/findDuplicate
 * @middleware ensureAuthenticated - Middleware to ensure the user is authenticated before accessing this route.
 * @param {string} req.body.username - The username to check for duplicates.
 * @param {string} req.body.email - The email to check for duplicates.
 * @returns {Object} 200 - A JSON object with success status and a message if no duplicates are found.
 * @returns {Object} 409 - A JSON object with success status and a message if a duplicate username or email is found.
 * @returns {Object} 500 - A JSON object with success status and a message if there is a server error.
 */
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

/**
 * Handles the POST request to edit the profile of the authenticated user.
 * 
 * This profile updates the user's profile information, including their name, username, and email. 
 * It searches for the user based on their current email and updates the profile with the new information.
 * If the user is successfully updated, it returns the updated user information. If the user is not found, 
 * it returns a 404 error. If an error occurs during the process, it logs the error and responds with a 
 * server error message.
 * 
 * @route POST /profile/editProfile
 * @middleware ensureAuthenticated - Middleware to ensure the user is authenticated before accessing this route.
 * @param {string} req.body.name - The new name of the user.
 * @param {string} req.body.username - The new username of the user.
 * @param {string} req.body.email - The new email of the user.
 * @returns {Object} 200 - A JSON object with success status and the updated user information if the profile is successfully updated.
 * @returns {Object} 404 - A JSON object with success status and a message if the user is not found.
 * @returns {Object} 500 - A JSON object with success status and a message if there is a server error.
 */
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