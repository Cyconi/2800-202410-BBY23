const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const bodyParser = require('body-parser');
const User = require('./user');
const WaitQueue = require('./queueSchema');
const ChatRoom = require('./chatRoomSchema');


router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

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
};

router.get('/', ensureAuthenticated, async (req, res) => {
    const queueCount = await WaitQueue.getQueueCount();
    res.render('waitingRoom', { queueCount: queueCount });
});

router.get('/chatroom', ensureAuthenticated, async (req, res) => {
    const email = req.user.email;
    const chatRoom = await ChatRoom.findOne({ $or: [{ user1: email }, { user2: email }] });
    if (chatRoom) {
        req.user.interpersonalAmount += 10;
        await req.user.save();
        return res.render("chatroom");
    }
    res.redirect('/chat');

});

router.post('/join', ensureAuthenticated, async (req, res) => {
    const email = req.user.email;
    let hobbies = req.body.interests || []; // get the hobbies from req.body.interests
    let userExists = await WaitQueue.findOne({ email: email });

    if (userExists) {
        userExists.inQueue = true;
        userExists.time = Date.now();
        userExists.hobbies = hobbies; // update the hobbies
        await userExists.save();
    } else {
        userExists = new WaitQueue({ email: email, inQueue: true, time: Date.now(), hobbies: hobbies });
        await userExists.save();
    }
    res.sendStatus(204);
});


router.post('/leave', ensureAuthenticated, async (req, res) => {
    const email = req.user.email;
    const userExists = await WaitQueue.findOne({ email: email });
    //const queueCount = await WaitQueue.getQueueCount();
    if (userExists) {
        userExists.inQueue = false;
        await userExists.save();
    }
    res.sendStatus(204);
    //res.render('waitingRoom', { queueCount: queueCount });
});

router.post('/autoleave', ensureAuthenticated, async (req, res) => {
    try{
    const currentRoot = req.originalUrl;
    if (!currentRoot.toString().includes('/chat')) {
        const email = req.user.email;
        const userExists = await WaitQueue.findOne({ email: email });
        if (userExists) {
            userExists.inQueue = false;
            await userExists.save();
        }
    }
    res.json({ success: true });
    } catch (error){
    }
});


router.get('/matchFound', ensureAuthenticated, async (req, res) => {
    await matchUsers();
    const chatRoom = await ChatRoom.findOne({ $or: [{ user1: req.user.email }, { user2: req.user.email }] });
    if (chatRoom){
        req.user.interpersonalAmount += 10;
        await req.user.save();
        return res.json({ success: true, redirectTo: '/chat/chatroom' });
    }
    res.json({ success: false });
});


async function matchUsers() {
    // After adding to the queue, try to match users
    const usersInQueue = await WaitQueue.find({ inQueue: true }).limit(2);
    if (usersInQueue.length === 2) {
        // Remove users from the queue
        await WaitQueue.updateMany({ email: { $in: [usersInQueue[0].email, usersInQueue[1].email] } }, { inQueue: false });

        // Create a chat room for these users
        const chatRoom = new ChatRoom({
            user1: usersInQueue[0].email,
            user2: usersInQueue[1].email,
            user1Hobbies: usersInQueue[0].hobbies, // pass user1's hobbies
            user2Hobbies: usersInQueue[1].hobbies  // pass user2's hobbies
        });
        await chatRoom.save();

        return true;
    } else {
        return false;
    }
};


router.get('/updateQueue', ensureAuthenticated, async (req, res) => {
    const queueCount = await WaitQueue.getQueueCount();
    res.json({ success: true, queueCount: queueCount });
});


router.post('/closeRoom', ensureAuthenticated, async (req, res) => {
    const email = req.user.email;
    const queueCount = await WaitQueue.getQueueCount();
    const chatRoom = await ChatRoom.deleteMany({ $or: [{ user1: email }, { user2: email }] });

    res.render('waitingRoom', { queueCount: queueCount });
});

router.post('/pushMsg', ensureAuthenticated, async (req, res) => {
    const user = req.user;
    const message = req.body.message; // Extract the message string from the request body
    const chatRoom = await ChatRoom.findOne({ $or: [{ user1: user.email }, { user2: user.email }] });

    if (chatRoom) {
        chatRoom.messages.push({
            sender: user.name,
            email: user.email,
            message: message
        });
        await chatRoom.save();
        res.json({ success: true });
    } else
        res.status(404).json({ success: false, message: 'Chat room not found' });
});

router.get('/pullMsg', ensureAuthenticated, async (req, res) => {
    const user = req.user;
    const chatRoom = await ChatRoom.findOne({ $or: [{ user1: user.email }, { user2: user.email }] })
        .populate('user1', 'hobbies')
        .populate('user2', 'hobbies');
    if (chatRoom) {
        let otherUserHobbies = chatRoom.user1 === user.email ? chatRoom.user2Hobbies : chatRoom.user1Hobbies;
        res.json({ success: true, chatRoom: chatRoom.messages, email: user.email, otherUserHobbies: otherUserHobbies });
    } else {
        res.json({ success: false, redirectTo: '/chat' });
    }
});

module.exports = router;