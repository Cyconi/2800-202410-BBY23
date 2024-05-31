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

/**
 * Handles the GET request to access the chatroom for the authenticated user.
 * 
 * This get searches for a chat room associated with the authenticated user's email.
 * If a chat room is found, it increments the user's interpersonal amount by 10, saves the updated user information,
 * and renders the chatroom view. If no chat room is found, it redirects the user to the chat page.
 * 
 * @route GET /chat/chatroom
 * @middleware ensureAuthenticated - Middleware to ensure the user is authenticated before accessing this route.
 * @returns {Object} 200 - Renders the 'chatroom' view if a chat room is found.
 * @returns {Object} 302 - Redirects to the chat page if no chat room is found.
 * @returns {Object} 500 - Sends an error message if there is an internal server error.
 */
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

/**
 * Adds the authenticated user to the wait queue.
 * 
 * This post updates the wait queue with the user's email, current time, and hobbies.
 * If the user already exists in the queue, it updates their information; otherwise, it adds them to the queue.
 * 
 * @route POST /chat/join
 * @middleware ensureAuthenticated - Middleware to ensure the user is authenticated before accessing this route.
 * @params {Array} [req.body.interests] - An array of hobbies or interests.
 * @returns {Object} 204 - Sends a 204 No Content status if the operation is successful.
 */
router.post('/join', ensureAuthenticated, async (req, res) => {
    const email = req.user.email;
    let hobbies = req.body.interests || []; 
    let userExists = await WaitQueue.findOne({ email: email });

    if (userExists) {
        userExists.inQueue = true;
        userExists.time = Date.now();
        userExists.hobbies = hobbies;
        await userExists.save();
    } else {
        userExists = new WaitQueue({ email: email, inQueue: true, time: Date.now(), hobbies: hobbies });
        await userExists.save();
    }
    res.sendStatus(204);
});


/**
 * Removes the authenticated user from the wait queue.
 * 
 * This post updates the wait queue by setting the user's inQueue status to false.
 * If the user exists in the queue, it updates their information; otherwise, it does nothing.
 * 
 * @route POST /chat/leave
 * @middleware ensureAuthenticated - Middleware to ensure the user is authenticated before accessing this route.
 * @returns {Object} 204 - Sends a 204 No Content status if the operation is successful.
 */
router.post('/leave', ensureAuthenticated, async (req, res) => {
    const email = req.user.email;
    const userExists = await WaitQueue.findOne({ email: email });
    if (userExists) {
        userExists.inQueue = false;
        await userExists.save();
    }
    res.sendStatus(204);
});

/**
 * Automatically removes the authenticated user from the wait queue if they navigate away from the chat.
 * 
 * This post checks the current route and updates the wait queue by setting the user's inQueue status to false if they are not on the chat page.
 * 
 * @route POST /chat/autoleave
 * @middleware ensureAuthenticated - Middleware to ensure the user is authenticated before accessing this route.
 * @returns {Object} 200 - Sends a JSON response indicating success.
 */
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

/**
 * Matches users in the wait queue to create a chat room.
 * 
 * This get attempts to match two users from the wait queue and create a new chat room if a match is found.
 * If a chat room is created, it redirects the user to the chat room.
 * 
 * @route GET /chat/matchFound
 * @middleware ensureAuthenticated - Middleware to ensure the user is authenticated before accessing this route.
 * @returns {Object} 200 - Sends a JSON response indicating success and redirects to the chat room.
 */
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

/**
 * Matches users in the wait queue to create a chat room.
 * 
 * This function matches two users from the wait queue and creates a new chat room if a match is found.
 * It updates the wait queue to set inQueue status to false for the matched users.
 * 
 * @returns {boolean} - Returns true if a match is found and a chat room is created, otherwise false.
 */
async function matchUsers() {
    const usersInQueue = await WaitQueue.find({ inQueue: true }).limit(2);
    if (usersInQueue.length === 2) {
        await WaitQueue.updateMany({ email: { $in: [usersInQueue[0].email, usersInQueue[1].email] } }, { inQueue: false });

        const chatRoom = new ChatRoom({
            user1: usersInQueue[0].email,
            user2: usersInQueue[1].email,
            user1Hobbies: usersInQueue[0].hobbies, 
            user2Hobbies: usersInQueue[1].hobbies  
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

/**
 * Pushes a message to the chat room for the authenticated user.
 * 
 * This post adds a message to the chat room associated with the authenticated user's email.
 * 
 * @route POST /chat/pushMsg
 * @middleware ensureAuthenticated - Middleware to ensure the user is authenticated before accessing this route.
 * @params {string} req.body.message - The message to be added to the chat room.
 * @returns {Object} 200 - Sends a JSON response indicating success.
 * @returns {Object} 404 - Sends a JSON response if the chat room is not found.
 */
router.post('/pushMsg', ensureAuthenticated, async (req, res) => {
    const user = req.user;
    const message = req.body.message; 
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

/**
 * Pulls messages from the chat room for the authenticated user.
 * 
 * This get retrieves messages from the chat room associated with the authenticated user's email.
 * 
 * @route GET /chat/pullMsg
 * @middleware ensureAuthenticated - Middleware to ensure the user is authenticated before accessing this route.
 * @returns {Object} 200 - Sends a JSON response with the chat room messages and other user's hobbies.
 * @returns {Object} 302 - Redirects to the chat page if no chat room is found.
 */
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