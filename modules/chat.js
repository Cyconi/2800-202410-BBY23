const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require('./user');

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(express.static('public'));
router.use("/js", express.static("./webapp/public/js"));
router.use("/css", express.static("./webapp/public/css"));
router.use("/img", express.static("./webapp/public/img"));

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

router.get('/', (req, res) => {
    res.render('waitingQueue');
});

router.post("/waiting", ensureAuthenticated, async (req, res) => {
    const email = req.user.email;
    let userExists = await WaitQueue.findOne({ email: email });
    if (userExists) {
        userExists.inQueue = true;
        userExists.time = Date.now();
        await userExists.save();
    } else {
        userExists = new WaitQueue({ email: email, inQueue: true, time: Date.now() });
        await userExists.save();
    }
    const queueCount = await WaitQueue.getQueueCount();
    res.send({ message: "User has joined the WaitQueue", queueCount: queueCount });
});

router.post("/leave", ensureAuthenticated, async (req, res) => {
    const email = req.user.email;
    const userExists = await WaitQueue.findOne({ email: email });
    if (userExists) {
        userExists.inQueue = false;
        await userExists.save();
        const queueCount = await WaitQueue.getQueueCount();
        res.send({ message: "User has left the WaitQueue", queueCount: queueCount });
    } else {
        res.send({ message: "User not found in the queue" });
    }
});

module.exports = router;