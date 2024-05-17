const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require('./user');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Timer = require('./timerSchema');

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
    }
});

router.get('/', (req, res) => {
    res.render('index');
});


router.post('/forgot', async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email: email });

    if (!user) {
        return res.status(404).json({ success: false, message: "Couldn't find a user with that email!" });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPassword = resetToken;
    user.resetPasswordDate = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetURL = `http://${req.headers.host}/reset/${resetToken}`;
    const sendEmail = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset",
        text: `You (or someone) has requested a password reset for BetterU. To reset the password, please click this link: ${resetURL}.\n\nIf this is not you, please ignore this email and your password will remain unchanged.`
    };

    transporter.sendMail(sendEmail, (error, info) => {
        if (error) {
            return res.status(500).json({ success: false, message: "Error sending email: " + error.message });
        }
        res.json({ success: true, message: "Password reset link sent to your email" });
    });
});

router.get('/reset/:token', async (req, res) => {
    
    const user = await User.findOne({
        resetPassword: req.params.token,
        resetPasswordDate: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).send("Invalid or expired token");
    }

    res.render('resetPassword', { token: req.params.token });
});

router.post('/reset/:token', async (req, res) => {
    const user = await User.findOne({
        resetPassword: req.params.token,
        resetPasswordDate: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).send("Invalid or expired token");
    }

    if (req.body.password !== req.body.confirmPassword) {
        return res.status(400).send("Passwords do not match");
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    user.password = hashedPassword;
    user.resetPassword = undefined;
    user.resetPasswordDate = undefined;
    await user.save();
    
    res.send("Password has been reset successfully");
});

router.post('/login', async (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).send('Internal Server Error');
        }
        if (!user) {
            return res.status(401).send(info.message);
        }
        req.login(user, loginErr => {
            if (loginErr) {
                return res.status(500).send('Error logging in');
            }
            res.redirect('/index.html');
        });
    })(req, res, next);
});

router.post('/signup', async (req, res) => {
    const { username, name, email, password } = req.body;

    if (!username || !name || !email || !password) {
        return res.status(400).send('Signup Failed: All fields are required.');
    }

    if (username.trim() === "" || name.trim() === "" || email.trim() === "" || password.trim() === "") {
        return res.status(400).send('Signup Failed: All fields must be non-empty strings.');
    }

    try {
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).send('Signup Failed: User already exists with that email.');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, name, email, password: hashedPassword });
        await newUser.save();
        req.login(newUser, loginErr => {
            if (loginErr) {
                return res.status(500).send('Error during signup process.');
            }
            res.redirect('/index.html');
        });
    } catch (err) {
        res.status(500).send('Error during signup process: ' + err.message);
    }
});

module.exports = router;
