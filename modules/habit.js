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
router.post('/editHabit', async (req, res) => {
    const {habitID, habit, question, habitGood} = req.body;
    const isGood = habitGood === 'true';
    try{
        const result = await Habit.findOneAndUpdate(
            {id: habitID},
            {$set: {habit:habit, dailyQuestion:question}},
            );
        res.json({success:true});
    } catch (error){
        console.error("error editting habit: ", error);
        res.status(500).json({sucess: false, message: "internal server error. Could not update habit. Try again later."});
    }
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

router.post('/goodAdd', async (req, res) => {
    const { habit, question } = req.body;
    await addAHabit(req, res, habit, question, true);
})

router.post('/badAdd', async (req, res) => {
    const { habit, question } = req.body;
    await addAHabit(req, res, habit, question, false);
    
})
async function addAHabit(req, res, habit, question, goodOrBad){
    try{
        const existingHabit = await Habit.findOne({ email: req.user.email, good: goodOrBad, habit: habit, dailyQuestion: question });
        if (existingHabit) {
            return res.status(500).send("A habit with the same question and habit already exists.");
        }
        const newHabit = new Habit({email: req.user.email, good: goodOrBad, habit: habit, dailyQuestion: question, frequency: 1});
        await newHabit.save();
        res.render("habitSuccess", {good : goodOrBad});
    } catch (err) {
        res.status(500).send("Failed to save habit" + err.message);
    }
}
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

