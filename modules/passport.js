const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require("bcrypt");
const User = require('./user');

module.exports = function (passport) {
    passport.use(new LocalStrategy(
        { usernameField: 'username', passwordField: 'password' },
        async (username, password, done) => {
            try {
                const user = await User.findOne({ username: username });
                if (!user) {
                    return done(null, false, { message: 'username' });
                }
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    return done(null, false, { message: 'password' });
                }
                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    ));

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
