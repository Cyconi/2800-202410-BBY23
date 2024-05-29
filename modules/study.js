const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require('./user');
const StudySession = require('./studySession');
const Timer = require("./timerSchema");
const cron = require('node-cron');

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(express.static('public'));
router.use("/js", express.static("./webapp/public/js"));
router.use("/css", express.static("./webapp/public/css"));
router.use("/img", express.static("./webapp/public/img"));

/**
 * Middleware to ensure the user is authenticated.
 */
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

/**
 * Renders the study page.
 * @route GET /study
 */
router.get('/', (req, res) => {
    res.render('studyPage');
});

/**
 * Renders the study guide page.
 * @route POST /study/guides
 */
router.post("/guides", (req, res) => {
    res.render("studyGuide");
});

/**
 * Renders the study session page and calculates the remaining timer.
 * This is for the URL.
 * @route GET /study/session
 * @middleware ensureAuthenticated
 */
router.get('/session', ensureAuthenticated, async (req, res) => {
    try {
        const timer = await Timer.findOne({ email: req.user.email });
        let timeLeft = 0;
        let isPaused = false;
        if (timer) {
            if (!timer.isPaused) {
                const elapsed = Date.now() - timer.timeNow;
                timeLeft = elapsed >= timer.timer ? 0 : timer.timer - elapsed;
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

/**
 * Handles the study session post request and calculates the remaining timer.
 * This is for the button.
 * @route POST /study/session
 * @middleware ensureAuthenticated
 */
router.post("/session", ensureAuthenticated, async (req, res) => {
    try {
        const timer = await Timer.findOne({ email: req.user.email });
        let timeLeft = 0;
        let isPaused = false;
        if (timer) {
            if (!timer.isPaused) {
                const elapsed = Date.now() - timer.timeNow;
                timeLeft = elapsed >= timer.timer ? 0 : timer.timer - elapsed;
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

/**
 * Redirects to the study log page.
 * @route POST /study/studyLog
 */
router.post("/log", (req, res) => {
    res.redirect("/study/studyLog");
});

/**
 * Renders the Pomodoro guide page.
 * @route POST /study/pomodoro
 */
router.post("/pomodoro", (req, res) => {
    res.render("pomodoro");
});

/**
 * Renders the Active Recall guide page.
 * @route POST /study/actRecall
 */
router.post("/actRecall", (req, res) => {
    res.render("actRecall");
});

/**
 * Renders the Feynman Technique guide page.
 * @route POST /study/feynman
 */
router.post("/feynman", (req, res) => {
    res.render("feynman");
});

/**
 * Adds an additional percentage to the user's knowledge percentage after logging a session.
 * @route POST /logSession
 * @param {string} req.body.subject - The subject of the study session.
 * @param {number} req.body.duration - The duration of the study session in minutes.
 * @param {string} req.body.notes - Notes for the study session.
 */
router.post('/logSession', ensureAuthenticated, async (req, res) => {
    const { subject, duration, notes } = req.body;
    const email = req.user.email;
    if (duration < 0) {
        return res.json({ success: false, message: "You entered a negative time, are you Chronos?" });
    }
    const newSession = new StudySession({ email: email, subject: subject, duration: duration, notes: notes, date: Date.now() });
    await newSession.save();

    const additionalNumber = (duration / 5);
    req.user.knowledgeAmount = req.user.knowledgeAmount + additionalNumber;
    await req.user.save();

    return res.json({ success: true });
});

/**
 * Loads the knowledge level for the profile page based on all session durations.
 * @route GET /profile
 */
router.get('/profile', ensureAuthenticated, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email });
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.render('profile', { user });
    } catch (error) {
        res.status(500).send("Internal server error");
    }
});

/**
 * Renders the study log page with the user's study sessions.
 * @route GET /study/studyLog
 */
router.get('/studyLog', async (req, res) => {
    const sessions = await StudySession.find({ email: req.user.email }).sort({ date: -1 });
    res.render('studyLog', { sessions });
});

/**
 * Updates the timer in the database.
 * @route POST /serverTimer
 * @middleware ensureAuthenticated
 * @param {boolean} req.body.isPaused - Indicates if the timer is paused.
 * @param {number} req.body.timer - The timer value in milliseconds.
 */
router.post('/serverTimer', ensureAuthenticated, async (req, res) => {
    const { isPaused, timer } = req.body;
    try {
        const timerExists = await Timer.findOne({ email: req.user.email });

        if (timerExists) {
            await timerExists.updateOne({
                timer: timer,
                isPaused: isPaused,
                timeNow: Date.now()
            });
        } else {
            const newTimer = new Timer({
                email: req.user.email,
                timer: timer,
                isPaused: isPaused,
                timeNow: Date.now()
            });
            await newTimer.save();
        }
        res.status(200).send("Timer updated successfully");
    } catch (error) {
        res.status(500).send("Internal server error");
    }
});

/**
 * Cron job to delete old study sessions every hour.
 */
cron.schedule('0 * * * *', async () => {
    try {
        const elevenDaysAgo = new Date();
        elevenDaysAgo.setDate(elevenDaysAgo.getDate() - 11);

        await StudySession.deleteMany({ date: { $lt: elevenDaysAgo } });
    } catch (error) {
        console.error('Error deleting old study sessions:', error);
    }
});

module.exports = router;
