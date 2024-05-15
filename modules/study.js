const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require('./user');

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
module.exports = router;