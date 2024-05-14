const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require('./user');

router.get('/', (req, res) => {
    res.render('index');
});

router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).send('Internal Server Error');
        }
        if (!user) {
            return res.status(401).send(info.message);
        }
        req.login(user, loginErr => {
            if (loginErr) {
                return res.status(500).send('Error logging in');
            }
            res.redirect('/index.html');
        });
    })(req, res, next);
});

router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).send('Signup Failed: All fields are required.');
    }

    if (name.trim() === "" || email.trim() === "" || password.trim() === "") {
        return res.status(400).send('Signup Failed: All fields must be non-empty strings.');
    }

    try {
        const existingUser = await User.findOne({ $or: [{ email }, { name }] });
        if (existingUser) {
            return res.status(400).send('Signup Failed: User already exists with that username or email.');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();
        req.login(newUser, loginErr => {
            if (loginErr) {
                return res.status(500).send('Error during signup process.');
            }
            res.redirect('/index.html');
        });
    } catch (err) {
        res.status(500).send('Error during signup process: ' + err.message);
    }
});

module.exports = router;
