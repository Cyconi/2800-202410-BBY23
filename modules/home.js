const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require('./user');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Timer = require('./timerSchema');
const LEVELUPREQUIREMENT = 100;

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(express.static('public'));
router.use("/js", express.static("./webapp/public/js"));
router.use("/css", express.static("./webapp/public/css"));
router.use("/img", express.static("./webapp/public/img"));

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
    }
});

router.get('/', (req, res) => {
    res.render('index');
});


/**
 * Calculates the user's level based on their knowledge, interpersonal, and habit amounts.
 * 
 * This function checks if the user is authenticated. If not, it redirects them to the login page.
 * It calculates the user's level based on whether they meet the level-up requirement in at least two out of three areas:
 * knowledge, interpersonal, and habit amounts. If the user meets the requirement in at least two areas, their level is set to 2.
 * Otherwise, the level remains 1.
 * 
 * @returns {number} The user's level, either 1 or 2.
 */
function getUserLevel(req){
    if (!req.isAuthenticated()) {
        return res.redirect('/');
    }
    let level = 1;
    let leveledUp = 0;
    if(req.user.knowledgeAmount >= LEVELUPREQUIREMENT){
        leveledUp++;
    }
    if(req.user.interpersonalAmount >= LEVELUPREQUIREMENT){
        leveledUp++;
    }
    if(req.user.habitAmount >= LEVELUPREQUIREMENT){
        leveledUp++;
    }
    if(leveledUp >= 2){
        level = 2;
    }
    return level;
}

router.get('/home1', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/');
    }
    res.render('home1', { user: req.user, level: getUserLevel(req) });
});

router.get('/profile', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/');
    }
    res.render('profile', { user: req.user, level: getUserLevel(req) });
});

/**
 * Handles the POST request to initiate the password reset process for a user.
 * 
 * This post checks if the provided email exists in the database. If a security question is associated with the user,
 * it verifies the provided security answer. If the verification is successful, it generates a reset token, saves it in the user's
 * record along with an expiration date, and sends an email with the password reset link to the user.
 * 
 * @route POST /forgot
 * @param {string} req.body.email - The email of the user requesting the password reset.
 * @param {string} req.body.securityAnswer - The answer to the user's security question (if applicable).
 * @returns {Object} 200 - A JSON object with success status and a message if the password reset link is sent.
 * @returns {Object} 400 - A JSON object with success status and a message if the security answer is incorrect or missing.
 * @returns {Object} 404 - A JSON object with success status and a message if the user with the provided email is not found.
 * @returns {Object} 500 - A JSON object with success status and a message if there is an error sending the email.
 */
router.post('/forgot', async (req, res) => {
    const { email, securityAnswer } = req.body;
    const user = await User.findOne({ email: email });

    if (!user) {
        return res.status(404).json({ success: false, message: "Couldn't find a user with that email!" });
    }

    if (user.securityQuestion) {
        if (!securityAnswer) {
            return res.status(400).json({ success: false, message: "Security answer is required" });
        }
        const match = await bcrypt.compare(securityAnswer, user.securityAnswer);
        if (!match) {
            return res.status(400).json({ success: false, message: "Incorrect security answer" });
        }
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPassword = resetToken;
    user.resetPasswordDate = Date.now() + 3600000;
    await user.save();

    const resetURL = `http://${req.headers.host}/reset/${resetToken}`;
    const sendEmail = {
        from: process.env.EMAIL_USER, to: email, subject: "Password Reset", text: `You (or someone) has requested a password reset for BetterU. To reset the password, please click this link: ${resetURL}.\n\nIf this is not you, please ignore this email and your password will remain unchanged.`
    };

    transporter.sendMail(sendEmail, (error, info) => {
        if (error) {
            return res.status(500).json({ success: false, message: "Error sending email: " + error.message });
        }
        res.json({ success: true, message: "Password reset link sent to your email" });
    });
});

/**
 * Handles the GET request to render the password reset page.
 * 
 * This get verifies the reset token provided in the URL. It checks if a user with the specified token exists 
 * and if the token has not expired. If the token is valid, it renders the password reset page. If the token is invalid 
 * or expired, it responds with an error message.
 * 
 * @route GET /reset/:token
 * @param {string} req.params.token - The password reset token.
 * @returns {Object} 200 - Renders the 'resetPassword' view with the reset token.
 * @returns {Object} 400 - Sends an error message if the token is invalid or expired.
 *
 */
router.get('/reset/:token', async (req, res) => {
    const user = await User.findOne({
        resetPassword: req.params.token,
        resetPasswordDate: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).send("Invalid or expired token");
    }
    res.render('resetPassword', { token: req.params.token });
});

/**
 * Handles the POST request to reset the user's password.
 * 
 * This post verifies the reset token provided in the URL. It checks if a user with the specified token exists 
 * and if the token has not expired. It also ensures the new password and confirm password fields match. 
 * If the token is valid and the passwords match, it hashes the new password, updates the user's password, 
 * invalidates the reset token, and saves the changes. It responds with a success message upon successful password reset.
 * 
 * @route POST /reset/:token
 * @param {string} req.params.token - The password reset token.
 * @param {string} req.body.password - The new password provided by the user.
 * @param {string} req.body.confirmPassword - The confirmation of the new password.
 * @returns {Object} 200 - A JSON object with success status and a message if the password is successfully reset.
 * @returns {Object} 400 - A JSON object with success status and a message if the token is invalid/expired or passwords do not match.
 */
router.post('/reset/:token', async (req, res) => {
    const user = await User.findOne({
        resetPassword: req.params.token,
        resetPasswordDate: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    if (req.body.password !== req.body.confirmPassword) {
        return res.status(400).json({ success: false, message: "Passwords do not match" });
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    user.password = hashedPassword;
    
    user.resetPassword = crypto.randomBytes(20).toString('hex');
    user.resetPasswordDate = undefined;
    await user.save();
    
    res.status(200).json({ success: true, message: "Password has been reset successfully" });
});

/**
 * Handles the POST request to log in a user.
 * 
 * This post uses Passport's local authentication strategy to log in a user. It verifies the user's credentials 
 * and returns a success status if the login is successful. If there are any errors during authentication or login, 
 * it responds with the appropriate error message.
 * 
 * @route POST /login
 * @param {Function} next - The next middleware function in the stack.
 * @returns {Object} 200 - A JSON object with success status if the login is successful.
 * @returns {Object} 401 - A JSON object with success status and a message if the login credentials are incorrect.
 * @returns {Object} 500 - A JSON object with success status and a message if there is an internal server error.
 */
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: info.message });
        }
        req.login(user, loginErr => {
            if (loginErr) {
                return res.status(500).json({ success: false, message: 'Internal server error' });
            }
            return res.status(200).json({ success: true });
        });
    })(req, res, next);
});

/**
 * Handles the POST request to sign up a new user.
 * 
 * This post creates a new user account with the provided username, name, email, and password.
 * It also optionally accepts a security question and answer. The user's password and security answer 
 * are hashed before storing in the database. If the signup is successful, the user is automatically 
 * logged in. It checks for existing users with the same email or username and returns appropriate 
 * error messages if validation fails or if there is an internal server error.
 * 
 * @route POST /signup
 * @param {string} req.body.username - The desired username of the new user.
 * @param {string} req.body.name - The name of the new user.
 * @param {string} req.body.email - The email address of the new user.
 * @param {string} req.body.password - The password for the new account.
 * @param {string} [req.body.securityQuestion] - The optional security question for account recovery.
 * @param {string} [req.body.securityAnswer] - The optional answer to the security question.
 * @returns {Object} 200 - A JSON object with success status if the signup and login are successful.
 * @returns {Object} 400 - A JSON object or string with an error message if required fields are missing or invalid.
 * @returns {Object} 500 - A JSON object with an error message if there is an internal server error.
 */
router.post('/signup', async (req, res) => {
    const { username, name, email, password, securityQuestion, securityAnswer } = req.body;

    if (!username || !name || !email || !password) {
        return res.status(400).send('Signup Failed: All fields are required.');
    }
    if (username.trim() === "" || name.trim() === "" || email.trim() === "" || password.trim() === "") {
        return res.status(400).send('Signup Failed: All fields must be non-empty strings.');
    }

    try {
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.json({ success: false, message: "User already exists." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, name, email, password: hashedPassword, numberOfHabits: 0, 
            securityQuestion: securityQuestion || null,
            securityAnswer: securityAnswer ? bcrypt.hashSync(securityAnswer, 10) : null 
        });
        await newUser.save();
        req.login(newUser, loginErr => {
            if (loginErr) {
                return res.json({ success: false, message: "Error logging in." });
            }
            return res.json({ success: true });
        });
    } catch (err) {
        return res.json({ success: false, message: "Internal server error" });
    }
});

/**
 * Handles the POST request to retrieve the security question for a given user's email.
 * 
 * This post checks if a user with the provided email exists in the database. If the user exists 
 * and has a security question set, it returns the security question. If the user does not exist 
 * or does not have a security question set, it returns an appropriate error message.
 * 
 * @route POST /getSecurityQuestion
 * @param {string} req.body.email - The email of the user for whom the security question is being requested.
 * @returns {Object} 200 - A JSON object with success status and the security question if found.
 * @returns {Object} 400 - A JSON object with success status and a message if no security question is set for the user.
 * @returns {Object} 404 - A JSON object with success status and a message if the user with the provided email is not found.
 */
router.post('/getSecurityQuestion', async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email: email });

    if (!user) {
        return res.status(404).json({ success: false, message: "Couldn't find a user with that email!" });
    }

    if (user.securityQuestion) {
        return res.json({ success: true, question: user.securityQuestion });
    } else {
        return res.status(400).json({ success: true, message: "No security question set for this user." });
    }
});


module.exports = router;
