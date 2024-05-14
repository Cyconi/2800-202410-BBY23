const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require('./user');

router.get('/', (req, res) =>{
    res.render('index');
});

router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).send('Internal Server Error');
        }
        if (!user) {
            return res.status(401).send(info.message); // Make sure the error messages are appropriate and informative
        }
        req.login(user, loginErr => {
            if (loginErr) {
                return res.status(500).send('Error logging in');
            }
            res.redirect('/index.html'); // Redirect to a dashboard or appropriate route after login
        });
    })(req, res, next);
});

router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {

        const existingUser = await User.findOne({name});
        if (existingUser) {
            return res.status(400).send('Signup Failed: User already exists with that username.');
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
        res.status(500).send('Error during signup process.');
    }
});

module.exports = router;
