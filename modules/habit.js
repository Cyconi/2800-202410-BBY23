const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require('./user');
const Habit = require('./habitSchema');
const cron = require('node-cron');

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(express.static('public'));
router.use("/js", express.static("./webapp/public/js"));
router.use("/css", express.static("./webapp/public/css"));
router.use("/img", express.static("./webapp/public/img"));

router.post('/addFrequency', async (req, res) => {
    const { habitID } = req.body;
    try {
        const habit = await Habit.findOne({ id: habitID });
        if (habit) {
            const now = new Date();
            const habitStartDate = new Date(habit.whenMade);
            
            habit.frequency.push(1);

            habit.whenToAsk = new Date(now.setDate(now.getDate() + 1));
            await habit.save();
            req.user.habitAmount += 5;
            await req.user.save();
            res.sendStatus(204);
        } else {
            res.sendStatus(204);
        }
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});


async function updateFrequency() {
    try {
        const habits = await Habit.find();

        habits.forEach(async habit => {
            const now = new Date();
            const habitStartDate = new Date(habit.whenMade);
            const daysSinceStart = Math.floor((now - habitStartDate) / (1000 * 60 * 60 * 24));
            const intervalDifference = daysSinceStart;

            // Ensure the frequency array is long enough
            while (habit.frequency.length <= intervalDifference) {
                habit.frequency.push(0);
            }

            // Check if the last interval is 0, if not add 0
            if (habit.frequency[intervalDifference] === 0) {
                habit.frequency[intervalDifference] = 0;
            }

            await habit.save();
        });
    } catch (error) {
        console.error('Error updating frequency:', error.message);
    }
}

// Schedule the task to run every 24 hours
cron.schedule('0 0 * * *', updateFrequency);

router.post('/editHabit', async (req, res) => {
    const { habitID, habit, question, habitGood } = req.body;
    const isGood = habitGood === 'true';
    try {
        const result = await Habit.findOneAndUpdate(
            { id: habitID },
            { $set: { habit: habit, dailyQuestion: question, good: isGood } },
            { new: true }
        );
        res.json({ success: true, habit: result });
    } catch (error) {
        console.error("Error editing habit:", error);
        res.status(500).json({ success: false, message: "Internal server error. Could not update habit. Try again later." });
    }
});
router.get('/habitQuestion', ensureAuthenticated, async (req, res) =>{
    try{
    const habits = await Habit.find({email: req.user.email});
    if (habits.length > 0) {
        let habitArray = [];
        habits.forEach(habit => {
            if (habit.whenToAsk <= Date.now()) {
                habitArray.push(habit);
            }
        });
        if(habitArray.length > 0){
            return res.render('habitQuestion', { habits: habitArray });
        }
    }
    res.sendStatus(204);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

router.post("/indexRedirect", async (req, res) => {
    res.redirect("/home1");
});
router.post('/deleteHabit', ensureAuthenticated, async (req, res) => {
    const { habitID, habitGood } = req.body;
    const isGood = habitGood === 'true';
    try {
        const result = await Habit.findOneAndDelete({ id: habitID });
        console.log(result);
        req.user.numberOfHabits = req.user.numberOfHabits - 1;
        await req.user.save();
        res.json({ success: true, habit: result.habit });
    } catch (error) {
        console.error('Error deleting habit:', error);
        res.status(500).json({ success: false, message: 'Internal server error. Could not delete habit. Try again later.' });
    }
});
router.post('/name', ensureAuthenticated, async (req, res) => {
    res.json({name: req.user.name});
});
router.get('/', (req, res) => {
    if(!req.isAuthenticated()){
        res.redirect('/');
        return;
    }
    res.render('habitIndex');
});
router.post('/goodHabit', async (req, res) => {
    try {
        const goodHabits = await Habit.find({ email: req.user.email, good: true });
        console.log(goodHabits.length);
        res.render('habitList', { habits: goodHabits, good: true });
    } catch (err) {
        res.status(500).send("Error retrieving good habits");
    }
});
router.get('/badHabit', ensureAuthenticated, async (req, res) => {
    try {
        const goodHabits = await Habit.find({ email: req.user.email, good: false });
        res.render('habitList', { habits: goodHabits, good: false});
    } catch (err) {
        res.status(500).send("Error retrieving bad habits");
    }
});

router.get('/goodHabit', ensureAuthenticated, async (req, res) => {
    try {
        const goodHabits = await Habit.find({ email: req.user.email, good: true });
        res.render('habitList', { habits: goodHabits, good: true });
    } catch (err) {
        res.status(500).send("Error retrieving good habits");
    }
});

router.post('/badHabit', async (req, res) => {
    try {
        const goodHabits = await Habit.find({ email: req.user.email, good: false });
        res.render('habitList', { habits: goodHabits, good: false});
    } catch (err) {
        res.status(500).send("Error retrieving bad habits");
    }
});
router.post('/badHabitAdd', (req, res) => {
    res.render('habitAdd', { good: false });
})

router.get('/badHabitAdd', ensureAuthenticated, (req, res) => {
    res.render('habitAdd', { good: false });
});
router.get('/goodHabitAdd', ensureAuthenticated, (req, res) => {
    res.render('habitAdd', { good: true });
});
router.post('/goodHabitAdd', (req, res) => {
    res.render('habitAdd', { good: true });
})

function normalizeText(text) {
    return text.trim().toLowerCase();
}

router.post('/getFrequencyRatios', ensureAuthenticated, async (req, res) => {
    try {
        const { goodOrBad, timeRange } = req.body;
        const now = new Date();
        let intervalCount;

        switch (timeRange) {
            case 'week':

                intervalCount = 8;
                break;
            case 'month':
                intervalCount = 31;
                break;
            case 'year':
                intervalCount = 366;
                break;
            default:
                return res.json({ success: false, error: 'Invalid time range' });
        }

        const habits = await Habit.find({ email: req.user.email, good: goodOrBad });
        const totalMaxFrequencies = new Array(intervalCount).fill(0);
        const totalFrequencies = new Array(intervalCount).fill(0);

        habits.forEach(habit => {
            const habitStartIndex = habit.frequency.length - intervalCount;
            const habitEndIndex = habit.frequency.length - 1;
            let isExists = false;
            for (let i = habitStartIndex; i <= habitEndIndex; i++) {
                const index = i - habitStartIndex;
                if (index >= 0 && index < intervalCount) {
                    if(habit.frequency.length === 0 && !isExists){
                        totalMaxFrequencies[totalMaxFrequencies.length - 1] += 1;
                        isExists = true;
                    }
                    if(!isNaN(habit.frequency[i])){
                        totalFrequencies[index] += habit.frequency[i];
                        totalMaxFrequencies[index] += 1;
                    }
                }
            }
        });

        const frequencyRatios = totalFrequencies.map((freq, index) => (totalMaxFrequencies[index] > 0 ? (freq / totalMaxFrequencies[index]) * 100 : 0));
        console.log('frequencyRatios:', frequencyRatios);
        console.log('totalMaxFrequencies:', totalMaxFrequencies);
        console.log('totalFrequencies:', totalFrequencies);
        res.json({ success: true, frequencyRatios });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});




// Check for existing habit
router.post("/existingHabitCheck", ensureAuthenticated, async (req, res) => {
    const { goodOrBad, habit, question } = req.body;
    const normalizedHabit = normalizeText(habit);
    const normalizedQuestion = normalizeText(question);

    const existingHabit = await Habit.findOne({ email: req.user.email, good: goodOrBad, normalizedHabit: normalizedHabit });
    const existingQuestion = await Habit.findOne({ email: req.user.email, good: goodOrBad, normalizedQuestion: normalizedQuestion });

    if (existingHabit) {
        return res.json({ error: true, message: "Habit with same name already exists!" });
    }

    if (existingQuestion) {
        return res.json({ error: true, message: "Habit with the same question already exists!" });
    }

    res.json({ error: false });
});

// Add a habit
router.post('/addAHabit', ensureAuthenticated, async (req, res) => {
    const { habit, question, goodOrBad } = req.body;
    const normalizedHabit = normalizeText(habit);
    const normalizedQuestion = normalizeText(question);
    const whenToAsk = new Date(Date.now());
    whenToAsk.setSeconds(whenToAsk.getSeconds() + 1);

    try {
        const newHabit = new Habit({
            email: req.user.email,
            good: goodOrBad,
            habit: habit,
            dailyQuestion: question,
            frequency: [],
            normalizedHabit: normalizedHabit,
            normalizedQuestion: normalizedQuestion,
            whenToAsk: whenToAsk,
            whenMade: Date.now()
        });

        await newHabit.save();

        req.user.numberOfHabits += 1;
        await req.user.save();

        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});



router.get('/habitList', async (req, res) => {
    const good = req.query.good === 'true';

    try {
        const habits = await Habit.find({ email: req.user.email, good: good });
        res.render('habitList', { habits: habits, good: good });
    } catch (err) {
        res.status(500).send("Error retrieving habits");
    }
});
router.get('/habitSuccess', (req, res) =>{

});
module.exports = router;

