const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require('./user');

router.get('/', (req, res) => {
    if(!req.isAuthenticated()){
        console.log("Bye bye");
        res.redirect('/');
        return;
    }
    console.log("Hello");
    res.render('habitIndex');
});
router.post('/goodHabit', (req, res) => {
    res.render('habitLists', { good: true });
})
router.post('/badHabit', (req, res) => {
    res.render('habitLists', { good: false });
})
router.post('/badHabitAdd', (req, res) => {
    res.render('addsAHabit', { good: false });
})
router.post('/goodHabitAdd', (req, res) => {
    res.render('addsAHabit', { good: true });
})

router.post('/add', async (req, res) => {
    console.log("Hello");
    const { habit, question } = req.body;

    console.log(habit);
    console.log(question);
    res.send("hhabit dick");
})
module.exports = router;

