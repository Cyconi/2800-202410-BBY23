const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require('./user');

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(express.static('public'));
router.use("/js", express.static("./webapp/public/js"));
router.use("/css", express.static("./webapp/public/css"));
router.use("/img", express.static("./webapp/public/img"));

router.get('/', (req, res) => {
    res.render('study-page');
});

router.post("/guides", (req, res) => {
    res.render("study-guide");
});

router.post("/session", (req, res) => {
    res.render("study-session");
});

router.post("/log", (req, res) => {
    res.render("study-log");
});

router.post("/pomodoro", (req, res) => {
    res.render("pomodoro");
});

router.post("/act-recall", (req, res) => {
    res.render("act-recall");
});

router.post("/feynman", (req, res) =>{
    res.render("feynman");
});

router.get('/study-session', (req, res) => {
    res.render('study-session');
});

router.post('/log-study-session', async (req, res) => {
    const { subject, duration, notes } = req.body;
    const newSession = new StudySession({ subject, duration, notes, date: new Date() });
    await newSession.save();
    res.redirect('/study-log');
});

router.get('/study-log', async (req, res) => {
    const sessions = await StudySession.find().sort({ date: -1 });
    res.render('study-log', { sessions });
});






module.exports = router;