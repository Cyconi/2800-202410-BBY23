const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require('./user');
const Habit = require('./habitSchema');

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

router.post("/addFrequency", async (req, res) => {
    const { habitID } = req.body;
    try {
        const habit = await Habit.findOne({ id: habitID });
        if (habit) {
            const today = new Date();
            const newFrequency = (habit.frequency.length > 0 ? habit.frequency[habit.frequency.length - 1] : 0) + 1;
            habit.frequency.push(newFrequency);
            habit.whenToAsk = new Date(today.setSeconds(today.getSeconds() + 30));
            await habit.save();
            
        } else {
           
        }
    } catch (error) {
    }
});

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
    res.redirect('/home1');
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

router.post('/getFrequencyRatios', async (req, res) => {
    try {
        const { goodOrBad, timeRange } = req.body;
        const now = new Date();
        let start;

        switch (timeRange) {
            case 'week':
                start = new Date(now.getTime() - 7 * 30 * 1000); // 7 "days" ago
                break;
            case 'month':
                start = new Date(now.getTime() - 30 * 30 * 1000); // 30 "days" ago
                break;
            case 'year':
                start = new Date(now.getTime() - 365 * 30 * 1000); // 365 "days" ago
                break;
            default:
                return res.json({ success: false, error: 'Invalid time range' });
        }

        const habits = await Habit.find({ email: req.user.email, good: goodOrBad });
        const timeDifference = now.getTime() - start.getTime();
        const dayDifference = Math.floor(timeDifference / (30 * 1000)); // Number of 10-second intervals

        let totalMaxFrequencies = new Array(dayDifference + 1).fill(0);
        let totalFrequencies = new Array(dayDifference + 1).fill(0);

        habits.forEach(habit => {
            const habitStartDate = new Date(habit.whenMade);
            const habitStartIndex = Math.floor((habitStartDate.getTime() - start.getTime()) / (30 * 1000));
            const habitEndIndex = Math.min(dayDifference, Math.floor((now.getTime() - habitStartDate.getTime()) / (30 * 1000)));

            console.log("Habit start date: " + habitStartDate);
            console.log("Habit start index: " + habitStartIndex);
            console.log("Habit end index: " + habitEndIndex);

            if (habit.frequency && habit.frequency.length > 0) {
                for (let i = habitStartIndex; i <= habitEndIndex; i++) {
                    const index = i - habitStartIndex;
                    if (index < habit.frequency.length) {
                        totalFrequencies[i] += habit.frequency[index];
                    }
                    totalMaxFrequencies[i] += 1; // Increment max frequencies correctly
                }
            }
        });

        // Ensure max frequencies are cumulative and do not decrease
        for (let i = 1; i <= dayDifference; i++) {
            if (totalMaxFrequencies[i] < totalMaxFrequencies[i - 1]) {
                totalMaxFrequencies[i] = totalMaxFrequencies[i - 1];
            }
        }

        // Debugging logs
        console.log("totalFrequencies:", totalFrequencies);
        console.log("totalMaxFrequencies:", totalMaxFrequencies);

        const frequencyRatios = totalFrequencies.map((frequency, i) => {
            const ratio = totalMaxFrequencies[i] > 0 ? frequency / totalMaxFrequencies[i] : 0;
            console.log(`Day ${i}: Frequency ${frequency}, Max Frequency ${totalMaxFrequencies[i]}, Ratio ${ratio}`);
            return ratio;
        });

        res.json({ success: true, frequencyRatios, start, end: now });
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

