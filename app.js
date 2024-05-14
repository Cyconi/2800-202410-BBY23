require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());
const fs = require("fs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const session = require("express-session");
const port = process.env.PORT || 3000;
const MongoStore = require('connect-mongo');


// Serve static files from the 'public' directory
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use("/js", express.static("./webapp/public/js"));
app.use("/css", express.static("./webapp/public/css"));
app.use("/img", express.static("./webapp/public/img"));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URL}),
    cookie: { maxAge: 3600000 }
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("MongoDB connected successfully"))
    .catch(err => console.error("Failed to connect to MongoDB:", err));

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

passport.use(new LocalStrategy(
    async (username, password, done) => {
        try {
            const user = await User.findOne({ username });
            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return done(null, false, { message: 'Incorrect password.' });
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

app.post('/login', (req, res, next) => {
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

app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).send('Signup Failed: User already exists with that username.');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
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
app.get("/", function (req, res) {
    //console.log(process.env);
    // retrieve and send an HTML document from the file system
    let doc = fs.readFileSync("./webapp/login.html", "utf8");
    res.send(doc);
});

// Set up routes
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Start the server
app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});