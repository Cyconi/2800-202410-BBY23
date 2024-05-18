const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require('./user');
const StudySession = require('./studySession');
const Timer = require("./timerSchema");

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

router.post("/session", ensureAuthenticated, async (req, res) => {
    try {
        const timer = await Timer.findOne({ email: req.user.email });
        let timeLeft = 0;
        let isPaused = false;
        if (timer) {
            if (!timer.isPaused) {
                const elapsed = Date.now() - timer.timeNow;
                if (elapsed >= timer.timer) {
                    timeLeft = 0; 
                } else {
                    timeLeft = timer.timer - elapsed; 
                }
            } else {
                timeLeft = timer.timer; 
                isPaused = true;
            }
        }
        res.render('studySession', { timeLeft, isPaused });
    } catch (error) {
        res.status(500).send("Internal server error");
    }
});

router.post("/log", (req, res) => {
    res.redirect("/study/studyLog");
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

router.get('/studySession', ensureAuthenticated, async (req, res) => {
    try {
        const timer = await Timer.findOne({ email: req.user.email });
        let timeLeft = 0;
        let isPaused = false;
        if (timer) {
            if (!timer.isPaused) {
                const elapsed = Date.now() - timer.timeNow;
                if (elapsed >= timer.timer) {
                    timeLeft = 0; 
                } else {
                    timeLeft = timer.timer - elapsed; 
                }
            } else {
                timeLeft = timer.timer; 
                isPaused = true;
            }
        }
        res.render('studySession', { timeLeft, isPaused });
    } catch (error) {
        res.status(500).send("Internal server error");
    }
});

router.post('/logSession', ensureAuthenticated, async (req, res) => {
    console.log("HELLO");
    const { subject, duration, notes } = req.body;
    const email = req.user.email;
    const newSession = new StudySession({ email: email, subject: subject, duration: duration, notes: notes, date: Date.now() });
    await newSession.save();
    const sessions = await StudySession.find({email: email}).sort({ date: -1 });
    res.render('studyLog', { sessions });
});

router.get('/studyLog', async (req, res) => {
    const sessions = await StudySession.find(email: email).sort({ date: -1 });
    res.render('studyLog', { sessions });
});


router.post('/serverTimer', ensureAuthenticated, async (req, res) => {
    const { isPaused, timer } = req.body;
    try {
        const timerExists = await Timer.findOne({ email: req.user.email });

        if (timerExists) {
            const updateResult = await timerExists.updateOne({
                timer: timer,
                isPaused: isPaused,
                timeNow: Date.now()
            });
          
            const updatedTimer = await Timer.findOne({ email: req.user.email });
        } else {
            const newTimer = new Timer({
                email: req.user.email,
                timer: timer,
                isPaused: isPaused,
                timeNow: Date.now()
            });
            const saveResult = await newTimer.save();
        }
        res.status(200).send("Timer updated successfully");
    } catch (error) {
        res.status(500).send("Internal server error");
    }
});



module.exports = router;