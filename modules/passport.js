const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require("bcrypt");
const User = require('./user');

module.exports = function (passport) {
    passport.use(new LocalStrategy(
        { usernameField: 'identifier', passwordField: 'password' },  // Note the change to 'identifier'
        async (identifier, password, done) => {
            try {
                // Search for the user by either username or email
                const user = await User.findOne({ $or: [{ username: identifier }, { email: identifier }] });
                if (!user) {
                    return done(null, false, { message: 'Username or email' });
                }
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    return done(null, false, { message: 'Password' });
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
