const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require('./user');

router.get('/', (req, res) => {
    res.render('studypage');
});

router.post("/guides", (req, res) => {
    res.render("studyguide");
});

router.post("/session", (req, res) => {
    res.render("studysession");
});

router.post("/log", (req, res) => {
    res.render("studylog");
});

module.exports = router;