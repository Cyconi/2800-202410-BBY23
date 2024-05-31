require('dotenv').config();
const express = require('express');
const app = express();
const session = require("express-session");
const MongoStore = require('connect-mongo');
const passport = require("passport");
const port = process.env.PORT || 3000;
const mongoose = require("mongoose");
const Timer = require('./modules/timerSchema.js');
const Habit = require('./modules/habitSchema');

// EJS 
app.set('view engine', 'ejs');
const path = require('path');
app.set('views', path.join(__dirname, 'webapp', 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use("/js", express.static("./webapp/public/js"));
app.use("/css", express.static("./webapp/public/css"));
app.use("/img", express.static("./webapp/public/img"));
app.use("/scenario", express.static("./scenario"));


function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

function ensureAuthNoRed(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.sendStatus(204);
}
// Session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URL }),
    cookie: { maxAge: 3600000 }
}));

mongoose.connect(process.env.MONGO_URL)
    .then(async () => {
        console.log("MongoDB connected successfully");
        
    })
    .catch(err => {
        console.error("Failed to connect to MongoDB:", err);
        process.exit(1);
    });
// Passport
app.use(passport.initialize());
app.use(passport.session());
require('./modules/passport')(passport);

// Routes
app.use('/', require('./modules/home'));
app.use('/interpersonal', require('./modules/interpersonal'));
app.use('/habit', require('./modules/habit.js'))
app.use('/profile', require('./modules/profile.js'));
app.use('/study', require('./modules/study'));

app.post('/habit/habitQuestion', ensureAuthenticated, async (req, res) => {
    res.redirect('/habit/habitQuestion');
});

/**
 * Logs out the user and destroys the session.
 * 
 * This post handles user logout, destroying the session after the user is logged out.
 * If there is an error during the logout process, it responds with a 500 status code and an error message.
 * 
 * @route POST /logout
 * @returns {Object} 200 - Redirects to the home page after successful logout.
 * @returns {Object} 500 - Sends an error message if there is an error during logout.
 */

app.post('/logout', (req, res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).send('Error logging out');
            }
            res.redirect('/'); 
        });
    });
});

/**
 * Checks for habit notifications for the authenticated user.
 * 
 * This post checks if there are any habit notifications to be sent to the user.
 * If the user's last checked notification was more than an hour ago and there are habits that need attention,
 * it updates the user's notification status and responds accordingly.
 * 
 * @route POST /checkHabitNotification
 * @middleware ensureAuthNoRed - Middleware to ensure the user is authenticated before accessing this route.
 * @returns {Object} 200 - JSON response indicating whether there are notifications to be sent.
 * @returns {Object} 500 - JSON response with success: false if there is an error.
 */
app.post('/checkHabitNotification', ensureAuthNoRed, async (req, res) => {
    try {
        const oneHourAgo = new Date(Date.now() - 60 * 60* 1000);
        let notify = false;
        if(req.user.openedNotification === 1){
            return res.json({ success: true, notify: false });
        }
        if(req.user.lastCheckedNotification <= oneHourAgo){
            const habits = await Habit.find({ email: req.user.email});
            if (habits) {
                for (const habit of habits) {
                    if (habit.whenToAsk <= Date.now()) {
                        notify = true;
                        break;
                    }
                }
            }
            req.user.lastCheckedNotification = Date.now();
            req.user.openedNotification = 1;
            await req.user.save();
        }
        if (notify === true) {
            res.json({ success: true, notify: true });
        } else {
            res.json({ success: false, notify: false });
        }
    } catch (error) {
       
        res.json({ success: false });
    }
});


/**
 * Checks if the user is authenticated.
 * 
 * This post checks if the user is authenticated and responds with a JSON indicating the authentication status.
 * 
 * @route POST /checkAuth
 * @returns {Object} 200 - JSON response indicating the success status based on user authentication.
 */
app.post('/checkAuth', (req, res) =>{
    if(req.isAuthenticated()){
        return res.json({success: true});
    }
    res.json({success: false});
});


/**
 * Checks the FAQ item usage for the authenticated user.
 * 
 * This post checks if the user has used a specific FAQ item and updates the user's FAQ usage status if necessary.
 * 
 * @route POST /checkFAQ
 * @middleware ensureAuthNoRed - Middleware to ensure the user is authenticated before accessing this route.
 * @params {number} req.body.faqItem - The FAQ item to be checked.
 * @returns {Object} 200 - JSON response indicating whether the FAQ item usage was updated.
 * @returns {Object} 500 - JSON response with success: false if there is an error.
 */
app.post('/checkFAQ', ensureAuthNoRed, async (req, res) => {
    try {
        const faqItem = req.body.faqItem;
        if(req.user.faqUsed[faqItem] === 0){
            if (faqItem === 1) {
                req.user.faqUsed[faqItem] = 1;
                await req.user.save();
            }
            return res.json({success: true});
        } 
        res.json({success:false});
    } catch (error) {
        
        res.json({ success: false });
    }
});

/**
 * Updates the FAQ item usage for the authenticated user.
 * 
 * This endpoint updates the user's FAQ usage status for a specific FAQ item.
 * 
 * @route POST /updateFAQ
 * @params {Number} 
 * @returns {Object} 200 - JSON response indicating the success status of the update operation.
 * @returns {Object} 500 - JSON response with success: false if there is an error.
 */
app.post('/updateFAQ', async (req, res)=> {
    try{
        const faqItem = req.body.faqItem;
        req.user.faqUsed[faqItem] = 1;
        await req.user.save();
        return res.json({success: true});
    } catch (error){
        res.json({success: false});
    }
});

/**
 * Calculates the remaining time for a user's timer.
 * 
 * This post checks the user's timer and updates its status if the timer has elapsed.
 * 
 * @route POST /calculateTimeLeft
 * @returns {Object} 200 - JSON response indicating the success status of the calculation operation.
 * @returns {Object} 500 - JSON response with success: false if there is an error.
 */
app.post('/calculateTimeLeft', async (req, res) => {
    try {
        const timer = await Timer.findOne({email: req.user.email});
        if (timer) {
            console.log(!timer.isPaused);
            if (!timer.isPaused) {
                const elapsed = Date.now() - timer.timeNow;
                console.log("elapsed = " + elapsed);
                console.log("timer = " + timer.timer);
                if (elapsed >= timer.timer) {
                    timer.isPaused = true;
                    timer.timer = 0;
                    await timer.save();
                    return res.json({ success: true });
                }
            }
        }
        res.json({success:false});
    } catch (error) {   
        res.json({ success: false});
    }
});
app.use('/study', require('./modules/study'));

app.use('/chat', require('./modules/chat'));

app.get("*", (req, res) => {
    res.status(404);
    res.render("404");
});

// Start the server
app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});
