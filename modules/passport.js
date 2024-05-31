const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require("bcrypt");
const User = require('./user');


/**
 * Configures Passport for local authentication using username or email and password.
 * 
 * This module sets up Passport's local strategy to authenticate users based on either their username or email,
 * and their password. It also defines the serialization and deserialization methods for maintaining user sessions.
 * 
 * @param {Object} passport - The Passport object to be configured.
 */
module.exports = function (passport) {
    passport.use(new LocalStrategy(
        { usernameField: 'identifier', passwordField: 'password' }, 
        async (identifier, password, done) => {
            try {
                const user = await User.findOne({ $or: [{ username: identifier }, { email: identifier }] });
                if (!user) {
                    return done(null, false, { message: 'username or email' });
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
