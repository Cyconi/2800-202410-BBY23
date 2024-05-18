const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require('./user');
const nodemailer = require('nodemailer');
const crypto = require('crypto');


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

router.get('/', ensureAuthenticated, (req, res) => {
    res.render('profile', { user: req.user });
});

// Edit Profile route
router.get('/editProfile', ensureAuthenticated, (req, res) => {
    res.render('editProfile', { user: req.user });
});


router.post('/findDuplicate', ensureAuthenticated, async (req, res) => {
    try{
        const {name, username, email} = req.body;
        const existantUserName = await User.findOne({username: username});
        if(existantUserName){
            return res.json({success: false, message: "Username already exists"});
        }
        const existantEmail = await User.findOne({email: email});
        if(existantEmail){
            return res.json({success: false, message: "Email already exists"});
        }
        res.json({success: true});
    } catch (Error) {
        res.json({success: false});
    }
});

router.post('/editProfile', ensureAuthenticated, async (req, res) => {
    try {
        const { name, username, email } = req.body;
        const user = await User.findOneAndUpdate(
        {email: req.user.email},
        {$set: {email:email, name: name, username: username}},
        {new: true});
        if (user) {
            return res.json({success: true});
        } else {
            return res.json({success: false});
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

router.post('/profileElements', ensureAuthenticated, (req, res) => {
    const username = req.user.username;
    const name = req.user.name;
    const email = req.user.email;
    res.json({username: username, name: name, email: email});
});

module.exports = router;