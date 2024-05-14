const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require('./user');

router.post('/login', (req, res, next) => {
    // ...
});

router.post('/signup', async (req, res) => {
    // ...
});

module.exports = router;
