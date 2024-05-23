const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require('./user');
const fs = require('fs');
const path = require('path');

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
    res.render('interpersonal');
});

router.post('/completed', async (req, res) => {
    try{
        const {scenarioID} = req.body;
        console.log(scenarioID);
        let index = scenarioID - 1;
        if(req.user.interpersonalCompleted[index] !== 1){
            req.user.interpersonalCompleted[index] = 1;
            req.user.interpersonalAmount += 25;
            await req.user.save();
        }
        res.json({success: true});
    } catch (error){
        res.json({success: false, message: error.message});
    }
});

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
