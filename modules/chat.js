const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require('./user');
const WaitQueue = require('./queueSchema');

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

router.get('/', async (req, res) => {
    const queueCount = await WaitQueue.getQueueCount();
    res.render('waitingQueue', {queueCount: queueCount});
});

router.post("/waiting", ensureAuthenticated, async (req, res) => {
    const email = req.user.email;
    let userExists = await WaitQueue.findOne({ email: email });
    const queueCount = await WaitQueue.getQueueCount();
    if (userExists) {
        userExists.inQueue = true;
        userExists.time = Date.now();
        await userExists.save();
    } else {
        userExists = new WaitQueue({ email: email, inQueue: true, time: Date.now() });
        await userExists.save();
    }

    res.render('waitingQueue', { queueCount: queueCount });
});


router.post("/leave", ensureAuthenticated, async (req, res) => {
    const email = req.user.email;
    const userExists = await WaitQueue.findOne({ email: email });
    const queueCount = await WaitQueue.getQueueCount();
    if (userExists) {
        userExists.inQueue = false;
        await userExists.save();
    }
    res.render('waitingQueue', { queueCount: queueCount }); 
        
});

router.post('/updateQueue', ensureAuthenticated, async (req, res)=> {
    //const usersInQueue = await WaitQueue.find({ inQueue: true });
    const queueCount = await WaitQueue.getQueueCount();
    res.json({ success: true, queueCount: queueCount});
});

module.exports = router;