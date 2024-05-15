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
        console.log(goodHabits);
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
        console.log(goodHabits);
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

router.post('/goodAdd', async (req, res) => {
    const { habit, question } = req.body;
    await addAHabit(req, res, habit, question, true);
})

router.post('/badAdd', async (req, res) => {
    const { habit, question } = req.body;
    await addAHabit(req, res, habit, question, false);
    
})
router.post('/editHabit', async (req, res) => {
    const {habitID} = req.body;
    
});
router.post('/deleteHabit', async (req, res) => {
    const {habitID} = req.body;
    console.log("Habit id is = " + habitID);
    try{
        const result = await Habit.findOneAndDelete({id: habitID});
        console.log(result);
        res.render('habitSuccess');
    } catch (Error ){
        res.status(500).send("Internal server error. Could not delete habit. Try again later.");
    }
}); 

async function addAHabit(req, res, habit, question, goodOrBad){
    try{
        const existingHabit = await Habit.findOne({ email: req.user.email, good: goodOrBad, habit: habit, dailyQuestion: question });
        if (existingHabit) {
            return res.status(500).send("A habit with the same question and habit already exists.");
        }
        const newHabit = new Habit({email: req.user.email, good: goodOrBad, habit: habit, dailyQuestion: question, frequency: 1});
        await newHabit.save();
        res.render("habitSuccess", { redirectDelay: 5000, redirectUrl: '/habit' });
    } catch (err) {
        res.status(500).send("Failed to save habit");
    }
}

module.exports = router;

