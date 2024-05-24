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

router.get('/session', ensureAuthenticated, async(req, res) => {
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
//Adds additional Percentage to a user's knoweldge percentage after logging a session.
router.post('/logSession', ensureAuthenticated, async (req, res) => {
    const { subject, duration, notes } = req.body;
    const email = req.user.email;
    if(duration < 0){
        return res.json({success: false, message: "You entered a negative time, are you Chronos?"});
    }
    const newSession = new StudySession({ email: email, subject: subject, duration: duration, notes: notes, date: Date.now() });
    await newSession.save();

    const user = await User.findOne({ email: email });
    if (user) {
        const additionalNumber = (duration / 5);
        req.user.knowledgeAmount =  req.user.knowledgeAmount + additionalNumber;
        await user.save();
    }

    const sessions = await StudySession.find({email: req.user.email}).sort({ date: -1 });
    return res.json({success: true});
});

//loads the knowledge level for the profile page based on all sessions durations loaded up.
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


router.get('/studyLog', async (req, res) => {
    const sessions = await StudySession.find({email: req.user.email}).sort({ date: -1 });
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

cron.schedule('0 * * * *', async () => {
    try {
        const elevenDaysAgo = new Date();
        elevenDaysAgo.setDate(elevenDaysAgo.getDate() - 11);
        
        await StudySession.deleteMany({ date: { $lt: elevenDaysAgo } });
        console.log('Old study sessions deleted');
    } catch (error) {
        console.error('Error deleting old study sessions:', error);
    }
});

module.exports = router;
