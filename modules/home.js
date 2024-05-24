const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require('./user');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Timer = require('./timerSchema');
const LEVELUPREQUIREMENT = 100;

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(express.static('public'));
router.use("/js", express.static("./webapp/public/js"));
router.use("/css", express.static("./webapp/public/css"));
router.use("/img", express.static("./webapp/public/img"));

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

router.get('/home1', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/');
    }
    let level = 1;
    let leveledUp = 0;
    if(req.user.knowledgeAmount >= LEVELUPREQUIREMENT){
        leveledUp++;
    }
    if(req.user.interpersonalAmount >= LEVELUPREQUIREMENT){
        leveledUp++;
    }
    if(req.user.habitAmount >= LEVELUPREQUIREMENT){
        leveledUp++;
    }
    if(leveledUp >= 2){
        level = 2;
    }
    res.render('home1', { user: req.user, level: level });
});

router.get('/profile', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/');
    }
    let level = 1;
    let leveledUp = 0;
    if(req.user.knowledgeAmount >= LEVELUPREQUIREMENT){
        leveledUp++;
    }
    if(req.user.interpersonalAmount >= LEVELUPREQUIREMENT){
        leveledUp++;
    }
    if(req.user.habitAmount >= LEVELUPREQUIREMENT){
        leveledUp++;
    }
    if(leveledUp >= 2){
        level = 2;
    }
    res.render('profile', { user: req.user, level: level });
});


router.post('/forgot', async (req, res) => {
    const { email, securityAnswer } = req.body;
    const user = await User.findOne({ email: email });

    if (!user) {
        return res.status(404).json({ success: false, message: "Couldn't find a user with that email!" });
    }

    if (user.securityQuestion) {
        if (!securityAnswer) {
            return res.status(400).json({ success: false, message: "Security answer is required" });
        }
        const match = await bcrypt.compare(securityAnswer, user.securityAnswer);
        if (!match) {
            return res.status(400).json({ success: false, message: "Incorrect security answer" });
        }
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPassword = resetToken;
    user.resetPasswordDate = Date.now() + 3600000;
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
        return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    if (req.body.password !== req.body.confirmPassword) {
        return res.status(400).json({ success: false, message: "Passwords do not match" });
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    user.password = hashedPassword;
    
    user.resetPassword = crypto.randomBytes(20).toString('hex');
    user.resetPasswordDate = undefined;
    await user.save();
    
    res.status(200).json({ success: true, message: "Password has been reset successfully" });
});

router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: info.message });
        }
        req.login(user, loginErr => {
            if (loginErr) {
                return res.status(500).json({ success: false, message: 'Internal server error' });
            }
            return res.status(200).json({ success: true });
        });
    })(req, res, next);
});


router.post('/signup', async (req, res) => {
    const { username, name, email, password, securityQuestion, securityAnswer } = req.body;

    if (!username || !name || !email || !password) {
        return res.status(400).send('Signup Failed: All fields are required.');
    }

    if (username.trim() === "" || name.trim() === "" || email.trim() === "" || password.trim() === "") {
        return res.status(400).send('Signup Failed: All fields must be non-empty strings.');
    }

    try {
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.json({ success: false, message: "User already exists." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ 
            username, 
            name, 
            email, 
            password: hashedPassword, 
            numberOfHabits: 0, 
            securityQuestion: securityQuestion || null,
            securityAnswer: securityAnswer ? bcrypt.hashSync(securityAnswer, 10) : null 
        });
        await newUser.save();
        req.login(newUser, loginErr => {
            if (loginErr) {
                return res.json({ success: false, message: "Error logging in." });
            }
            return res.json({ success: true });
        });
    } catch (err) {
        return res.json({ success: false, message: "Internal server error" });
    }
});

router.post('/getSecurityQuestion', async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email: email });

    if (!user) {
        return res.status(404).json({ success: false, message: "Couldn't find a user with that email!" });
    }

    if (user.securityQuestion) {
        return res.json({ success: true, question: user.securityQuestion });
    } else {
        return res.status(400).json({ success: true, message: "No security question set for this user." });
    }
});


module.exports = router;
