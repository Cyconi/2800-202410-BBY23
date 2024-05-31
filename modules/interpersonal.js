const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require('./user');
const fs = require('fs');
const path = require('path');

// Middleware to parse JSON and URL-encoded data
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
// Serve static files from the 'public' directory
router.use(express.static('public'));
// Serve static JS files
router.use("/js", express.static("./webapp/public/js"));
// Serve static CSS files
router.use("/css", express.static("./webapp/public/css"));
// Serve static image files
router.use("/img", express.static("./webapp/public/img"));

/**
 * Middleware to ensure the user is authenticated.
 * If the user is authenticated, proceed to the next middleware or route handler.
 * If not, redirect the user to the home page.
 */
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

// Route to render the main page for interpersonal scenarios
router.get('/', (req, res) => {
    res.render('interpersonal');
});

/**
 * Handles the POST request to mark a scenario as completed for the authenticated user.
 * 
 * This post updates the user's progress by marking the specified scenario as completed. 
 * If the scenario was not previously completed, it updates the `interpersonalCompleted` array 
 * and increments the `interpersonalAmount` by 35. The changes are then saved to the database.
 * 
 * @route POST /interpersonal/completed
 * @param {Object} req - The request object containing the scenario ID.
 * @param {number} req.body.scenarioID - The ID of the scenario to mark as completed.
 * @param {Object} res - The response object used to send the response.
 * @returns {Object} 200 - A JSON object with success status if the scenario is marked completed.
 * @returns {Object} 200 - A JSON object with success status false if there was an error.
 */
router.post('/completed', async (req, res) => {
    try{
        const {scenarioID} = req.body;
        let index = scenarioID - 1;
        if(req.user.interpersonalCompleted[index] !== 1){
            req.user.interpersonalCompleted[index] = 1;
            req.user.interpersonalAmount += 35;
            await req.user.save();
        }
        res.json({success: true});
    } catch (error){
        res.json({success: false, message: error.message});
    }
});

/**
 * Route to render the scenario selection page.
 * Ensures the user is authenticated before allowing access.
 * Reads scenario data from JSON files, constructs an array of scenario objects,
 * and renders the 'select_scenario' template with the scenario data.
 * 
 * This function was created with the help of ChatGPT.
 */
router.get('/select-scenario', ensureAuthenticated, (req, res) => {
    const scenarioFiles = [
        'scenario1.json',
        'scenario2.json',
        'scenario3.json',
        'scenario4.json',
        'scenario5.json',
        'scenario6.json'
    ];

    const scenarios = scenarioFiles.map(file => {
        const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../scenario', file), 'utf-8'));
        return {
            id: data.scenarios[0].id,
            title: data.scenarios[0].title,
            description: data.scenarios[0].description,
            image: data.scenarios[0].image,
            gif: data.scenarios[0].gif
        };
    });

    res.render('select_scenario', { scenarios });
});

module.exports = router;
