const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require('./user');
const StudySession = require('./studySession');

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

router.get('/', (req, res) => {
    res.render('studyPage');
});

router.post("/guides", (req, res) => {
    res.render("studyGuide");
});

router.post("/session", (req, res) => {
    res.render("studySession");
});

router.post("/log", (req, res) => {
    res.render("studyLog");
});

router.post("/pomodoro", (req, res) => {
    res.render("pomodoro");
});

router.post("/actRecall", (req, res) => {
    res.render("actRecall");
});

router.post("/feynman", (req, res) =>{
    res.render("feynman");
});

router.get('/studySession', (req, res) => {
    res.render('studySession');
});

router.post('/logSession', ensureAuthenticated, async (req, res) => {
    console.log("HELLO");
    const { subject, duration, notes } = req.body;
    const email = req.user.email;
    const newSession = new StudySession({ email: email, subject: subject, duration: duration, notes: notes, date: Date.now() });
    await newSession.save();
    res.redirect('/studyLog');
});

router.get('/studyLog', async (req, res) => {
    const sessions = await StudySession.find().sort({ date: -1 });
    res.render('studyLog', { sessions });
});






module.exports = router;