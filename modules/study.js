const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require('./user');

router.get('/', (req, res) => {
    res.render('studypage');
});

module.exports = router;