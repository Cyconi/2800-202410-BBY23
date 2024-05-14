const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require("bcrypt");
const User = require('../modules/user');

module.exports = function (passport) {
    passport.use(new LocalStrategy(
        async (username, password, done) => {
            // ...
        }
    ));

    passport.serializeUser((user, done) => {
        // ...
    });

    passport.deserializeUser(async (id, done) => {
        // ...
    });
};
