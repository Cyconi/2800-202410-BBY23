const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require('./user');
const WaitQueue = require('./queueSchema');
const ChatRoom = require('./chatRoomSchema');
const { NULL } = require('mysql/lib/protocol/constants/types');

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
        return res.render("chatroom");
    }
    res.redirect('/chat');

});

router.post('/join', ensureAuthenticated, async (req, res) => {
    const email = req.user.email;
    let userExists = await WaitQueue.findOne({ email: email });
    //const queueCount = await WaitQueue.getQueueCount();
    if (userExists) {
        userExists.inQueue = true;
        userExists.time = Date.now();
        await userExists.save();
    } else {
        userExists = new WaitQueue({ email: email, inQueue: true, time: Date.now() });
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

router.get('/matchFound', ensureAuthenticated, async (req, res) => {
    await matchUsers();
    const chatRoom = await ChatRoom.findOne({ $or: [{ user1: req.user.email }, { user2: req.user.email }] });
    if (chatRoom)
        res.json({ success: true, redirectTo: '/chat/chatroom' });
    else
        res.json({ success: false });
});


async function matchUsers() {
    // After adding to the queue, try to match users
    const usersInQueue = await WaitQueue.find({ inQueue: true }).limit(2);
    if (usersInQueue.length === 2) {
        // Remove users from the queue
        await WaitQueue.updateMany({ email: { $in: [usersInQueue[0].email, usersInQueue[1].email] } }, { inQueue: false });

        // Create a chat room for these users
        const chatRoom = new ChatRoom({ user1: usersInQueue[0].email, user2: usersInQueue[1].email });
        await chatRoom.save();

        return true;
    } else {
        return false;
        //res.render('waitingRoom', { queueCount: queueCount });
    }
};

router.get('/updateQueue', ensureAuthenticated, async (req, res) => {
    const queueCount = await WaitQueue.getQueueCount();
    res.json({ success: true, queueCount: queueCount });
});


router.post('/leaveRoom', ensureAuthenticated, async (req, res) => {
    const email = req.user.email;
    const queueCount = await WaitQueue.getQueueCount();
    const chatRoom = await ChatRoom.deleteMany({ $or: [{ user1: email }, { user2: email }] });
    console.log(`${chatRoom.deletedCount} document(s) were deleted.`);

    res.render('waitingRoom', { queueCount: queueCount });
});


router.post('/pushMsg', ensureAuthenticated, async (req, res) => {
    const user = req.user;
    const message = req.body.message; // Extract the message string from the request body
    const chatRoom = await ChatRoom.findOne({ $or: [{ user1: user.email }, { user2: user.email }] });

    if (chatRoom) {
        chatRoom.messages.push({
            sender: user.name,
            message: message
        });
        await chatRoom.save();
        res.json({ success: true });
    } else
        res.status(404).json({ success: false, message: 'Chat room not found' });
});

router.get('/pullMsg', ensureAuthenticated, async (req, res) => {
    const user = req.user;
    const chatRoom = await ChatRoom.findOne({ $or: [{ user1: user.email }, { user2: user.email }] });
    if (chatRoom)
        res.json({ success: true, chatRoom: chatRoom.messages });
    else
        res.json({ success: false, redirectTo: '/chat' });
});

module.exports = router;