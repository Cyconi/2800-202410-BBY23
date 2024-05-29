require('dotenv').config();
const express = require('express');
const app = express();
const session = require("express-session");
const MongoStore = require('connect-mongo');
const passport = require("passport");
const port = process.env.PORT || 3000;
const mongoose = require("mongoose");
const User = require("./modules/user.js");
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

app.post('/checkAuth', (req, res) =>{
    if(req.isAuthenticated()){
        return res.json({success: true});
    }
    res.json({success: false});
});

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
app.post('/calculate', async (req, res) => {
    try {
        const timer = await Timer.findOne({email: req.user.email});
        if (timer) {
            if (!timer.isPaused) {
                const elapsed = Date.now() - timer.timeNow;
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
