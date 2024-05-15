const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require("bcrypt");
const User = require('./user');

module.exports = function (passport) {
    passport.use(new LocalStrategy({
        usernameField: 'email', 
        passwordField: 'password'
    }, async (email, password, done) => {
        try {
            const user = await User.findOne({ email: email });  
            if (!user) {
                return done(null, false, { message: 'No user found with that email.' });
            }
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });
};
