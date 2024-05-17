const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require('./user');
const Habit = require('./habitSchema');

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(express.static('public'));
router.use("/js", express.static("./webapp/public/js"));
router.use("/css", express.static("./webapp/public/css"));
router.use("/img", express.static("./webapp/public/img"));

router.post("/addFrequency", async(req, res) => {
    const {habitID} = req.body;
    const habit = await Habit.findOne({id: habitID});
    if(habit){
        habit.frequency = habit.frequency + 1;
        await habit.save();
    }
});

router.post('/editHabit', async (req, res) => {
    const { habitID, habit, question, habitGood } = req.body;
    const isGood = habitGood === 'true';
    try {
        const result = await Habit.findOneAndUpdate(
            { id: habitID },
            { $set: { habit: habit, dailyQuestion: question, good: isGood } },
            { new: true }
        );
        res.json({ success: true, habit: result });
    } catch (error) {
        console.error("Error editing habit:", error);
        res.status(500).json({ success: false, message: "Internal server error. Could not update habit. Try again later." });
    }
});
router.get('/habitQuestion', ensureAuthenticated, async (req, res) =>{
    const habits = await Habit.find({email: req.user.email});
    res.render("habitQuestion", {habits: habits});
});

router.post("/indexRedirect", (req, res) => {
    res.redirect("/home1");
});

router.post('/deleteHabit', ensureAuthenticated, async (req, res) => {
    const { habitID, habitGood } = req.body;
    const isGood = habitGood === 'true';
    try {
        const result = await Habit.findOneAndDelete({ id: habitID });
        console.log(result);
        res.json({ success: true, habit: result.habit });
    } catch (error) {
        console.error('Error deleting habit:', error);
        res.status(500).json({ success: false, message: 'Internal server error. Could not delete habit. Try again later.' });
    }
});
router.post('/name', ensureAuthenticated, async (req, res) => {
    res.json({name: req.user.name});
});
router.get('/', (req, res) => {
    if(!req.isAuthenticated()){
        res.redirect('/');
        return;
    }
    res.render('habitIndex');
});
router.post('/goodHabit', async (req, res) => {
    try {
        const goodHabits = await Habit.find({ email: req.user.email, good: true });
        res.render('habitList', { habits: goodHabits, good: true });
    } catch (err) {
        res.status(500).send("Error retrieving good habits");
    }
});
router.get('/badHabit', ensureAuthenticated, async (req, res) => {
    try {
        const goodHabits = await Habit.find({ email: req.user.email, good: false });
        res.render('habitList', { habits: goodHabits, good: false});
    } catch (err) {
        res.status(500).send("Error retrieving bad habits");
    }
});

router.get('/goodHabit', ensureAuthenticated, async (req, res) => {
    try {
        const goodHabits = await Habit.find({ email: req.user.email, good: true });
        res.render('habitList', { habits: goodHabits, good: true });
    } catch (err) {
        res.status(500).send("Error retrieving good habits");
    }
});

router.post('/badHabit', async (req, res) => {
    try {
        const goodHabits = await Habit.find({ email: req.user.email, good: false });
        res.render('habitList', { habits: goodHabits, good: false});
    } catch (err) {
        res.status(500).send("Error retrieving bad habits");
    }
});
router.post('/badHabitAdd', (req, res) => {
    res.render('addHabit', { good: false });
})

router.get('/badHabitAdd', ensureAuthenticated, (req, res) => {
    res.render('addHabit', { good: false });
});
router.get('/goodHabitAdd', ensureAuthenticated, (req, res) => {
    res.render('addHabit', { good: true });
});
router.post('/goodHabitAdd', (req, res) => {
    res.render('addHabit', { good: true });
})

function normalizeText(text) {
    return text.trim().toLowerCase();
}

// Check for existing habit
router.post("/existingHabitCheck", ensureAuthenticated, async (req, res) => {
    const { goodOrBad, habit, question } = req.body;
    const normalizedHabit = normalizeText(habit);
    const normalizedQuestion = normalizeText(question);

    const existingHabit = await Habit.findOne({ email: req.user.email, good: goodOrBad, normalizedHabit: normalizedHabit });
    const existingQuestion = await Habit.findOne({ email: req.user.email, good: goodOrBad, normalizedQuestion: normalizedQuestion });

    if (existingHabit) {
        return res.json({ error: true, message: "Habit with same name already exists!" });
    }

    if (existingQuestion) {
        return res.json({ error: true, message: "Habit with the same question already exists!" });
    }

    res.json({ error: false });
});

// Add a habit
router.post('/addAHabit', ensureAuthenticated, async (req, res) => {
    const { habit, question, goodOrBad } = req.body;
    const normalizedHabit = normalizeText(habit);
    const normalizedQuestion = normalizeText(question);

    try {
        const newHabit = new Habit({
            email: req.user.email,
            good: goodOrBad,
            habit: habit,
            dailyQuestion: question,
            frequency: 1,
            normalizedHabit: normalizedHabit,
            normalizedQuestion: normalizedQuestion
        });
        await newHabit.save();
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});


router.get('/habitList', async (req, res) => {
    const good = req.query.good === 'true';

    try {
        const habits = await Habit.find({ email: req.user.email, good: good });
        res.render('habitList', { habits: habits, good: good });
    } catch (err) {
        res.status(500).send("Error retrieving habits");
    }
});
router.get('/habitSuccess', (req, res) =>{

});
module.exports = router;

