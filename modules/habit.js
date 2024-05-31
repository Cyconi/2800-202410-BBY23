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

/**
 * The amount by which the user's habit amount is increased each time a frequency is added.
 * 
 * This number logically represents the discipline a user gets every time they mark a habit as done for the day.
 * 
 * @constant {number}
 * @default 5
 */
const INCREASECONFIDENCE = 5;

/**
 * The duration of one hour in milliseconds.
 * 
 * This constant is used to calculate time intervals in milliseconds.
 * 
 * @constant {number}
 * @default 3600000
 */
const ONEHOUR = 3600000;

/**
 * The duration of one day in milliseconds.
 * 
 * This constant is used to calculate time intervals in milliseconds, representing a full day.
 * 
 * @constant {number}
 * @default 86400000
 */
const ONEDAY = ONEHOUR * 24;

/**
 * The number of days in a week.
 * 
 * This constant is used for calculations involving weekly intervals.
 * 
 * @constant {number}
 * @default 7
 */
const DAYSINWEEK = 7;

/**
 * The number of days in a month.
 * 
 * This constant is used for calculations involving monthly intervals.
 * 
 * Note: This is an approximation, as months vary in length between 28 to 31 days.
 * 
 * @constant {number}
 * @default 30
 */
const DAYSINMONTH = 30;

/**
 * The number of days in a year.
 * 
 * This constant is used for calculations involving yearly intervals.
 * 
 * Note: This does not account for leap years, which have 366 days.
 * 
 * @constant {number}
 * @default 365
 */
const DAYSINYEAR = 365;

/**
 * Handles the POST request to add a frequency to a habit.
 * 
 * This logically represents a user doing a specific habit that day.
 * 
 * This post changes the date of habit.whenToAsk to 24 hours into the future. This is done so that
 * a user can only update a habit's frequency once every 24 hours. We also record this time to find out
 * when to give the user a notification.
 * 
 * The habit's frequency array is updated by adding a value of 1 to the last element of the array.
 * 
 * This was done so that it's easier to keep track of if the user had done that habit on that day.
 * It makes calculating specifically that much easier. For example did the user do x habit 8 days ago?
 * Well we know habit.frequency.length is today, so is .length - 9 an entry?
 * 
 * Habit amount is also increased by INCREASECONFIDENCE.
 * 
 * @route POST /habit/addFrequency
 * @param {string} req.body.habitID - The ID of the habit to update.
 * @returns {204} No Content - If the habit is successfully updated or if the habit is not found.
 * @returns {Object} 500 - An error object is returned if there is an internal server error.
 */
router.post('/addFrequency', async (req, res) => {
    const { habitID } = req.body;
    try {
        const habit = await Habit.findOne({ id: habitID });
        if (habit) {
            const now = new Date();
            const habitStartDate = new Date(habit.whenMade);
            
            habit.frequency.push(1);

            habit.whenToAsk = new Date(now.getTime() + ONEDAY);
            await habit.save();
            req.user.habitAmount += INCREASECONFIDENCE;
            req.user.openedNotification = 0;
            await req.user.save();
            res.sendStatus(204);
        } else {
            res.sendStatus(204);
        }
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});


/**
 * Handles the POST request to record a thumbs down action on a habit.
 * 
 * This logically represents a user who marks a habit as not done for the day.
 * 
 * Changese the habit.whenToAsk to 24 hours into the future.
 * 
 * @route POST /habit/thumbsDown
 * @param {string} req.body.habitID - The ID of the habit to update.
 * @returns {204} No Content - If the habit is successfully updated or if the habit is not found.
 * @returns {Object} 500 - An error object is returned if there is an internal server error.
 */
router.post('/thumbsDown', async (req, res) => {
    const { habitID } = req.body;
    try {
        const habit = await Habit.findOne({ id: habitID });
        if (habit) {
            const now = new Date();
            
            habit.whenToAsk = new Date(now.getTime() + ONEDAY);
            await habit.save();
            
            req.user.openedNotification = 0;
            await req.user.save();
            res.sendStatus(204);
        } else {
            res.sendStatus(204);
        }
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

/**
 * Updates the frequency of all habits to ensure they have an entry for each day since they were created.
 * 
 * This function fetches all habits from the database, calculates the number of days since each habit was created,
 * and ensures that the frequency array has an entry for each day. If an entry for the current day does not exist,
 * it adds a 0 to represent no activity for that day.
 * 
 * @async
 * @function updateFrequency
 * @throws {Error} Will log an error message if there is an issue retrieving or saving habits.
 */
async function updateFrequency() {
    try {
        const habits = await Habit.find();

        habits.forEach(async habit => {
            const now = new Date();
            const habitStartDate = new Date(habit.whenMade);
            const daysSinceStart = Math.floor((now - habitStartDate) / (ONEDAY));
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

// Define the time zone for the cron job
const timeZone = 'America/Los_Angeles';

// Schedule the updateFrequency function to run daily at midnight in the time zone
cron.schedule('0 0 * * *', updateFrequency, {
    timezone: timeZone
});

/**
 * Handles the POST request to edit an existing habit.
 * 
 * This post updates the details of a specified habit, including the habit name, daily question, 
 * and whether the habit is considered good or bad.
 * 
 * @route POST /habit/editHabit
 * @param {string} req.body.habitID - The ID of the habit to update.
 * @param {string} req.body.habit - The new name or description of the habit.
 * @param {string} req.body.question - The new daily question associated with the habit.
 * @param {string} req.body.habitGood - A string representing whether the habit is good ('true') or bad ('false').
 * @returns {Object} 200 - A JSON object containing the success status and the updated habit.
 * @returns {Object} 500 - A JSON object containing the success status and an error message if there is an internal server error.
 */
router.post('/editHabit', async (req, res) => {
    const { habitID, habit, question, habitGood } = req.body;

    //makes isGood is a boolean value not a string.
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

/**
 * Handles the GET request to render all the habits and the questions for each habit in habitQuestion.ejs.
 * 
 * This get fetches all habits associated with the authenticated user's email and filters out 
 * those that are due for a question based on the `whenToAsk` timestamp. If any habits are due, it 
 * renders the 'habitQuestion' view with these habits; otherwise, it responds with a 204 No Content status.
 * 
 * @route GET /habit/habitQuestion
 * @middleware ensureAuthenticated - Middleware to ensure the user is authenticated before accessing this route.
 * @returns {Object} 200 - Renders the 'habitQuestion' view with the due habits.
 * @returns {204} No Content - If no habits are due for a question.
 * @returns {500} Server Error - If there is an internal server error.
 */
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

//Simply redirects to home1.
router.post("/indexRedirect", async (req, res) => {
    res.redirect("/home1");
});

/**
 * Handles the POST request to delete an existing habit.
 * 
 * This post deletes the specified habit by its ID from the database. If the habit is successfully deleted, 
 * it responds with the deleted habit's details; otherwise, it responds with an error message.
 * 
 * @route POST /habit/deleteHabit
 * @param {string} req.body.habitID - The ID of the habit to delete.
 * @param {string} req.body.habitGood - A string representing whether the habit is good ('true') or bad ('false').
 * @returns {Object} 200 - A JSON object containing the success status and the deleted habit's details.
 * @returns {Object} 500 - A JSON object containing the success status and an error message if there is an internal server error.
 */
router.post('/deleteHabit', async (req, res) => {
    const { habitID, habitGood } = req.body;
    const isGood = habitGood === 'true';
    try {
        const result = await Habit.findOneAndDelete({ id: habitID });
        await req.user.save();
        res.json({ success: true, habit: result.habit });
    } catch (error) {
        console.error('Error deleting habit:', error);
        res.status(500).json({ success: false, message: 'Internal server error. Could not delete habit. Try again later.' });
    }
});

//Simply to return the user's name.
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

/**
 * Handles the POST request to retrieve all good habits for the authenticated user.
 * 
 * This post fetches all habits associated with the authenticated user's email that are marked as good
 * and renders the 'habitList' view with these habits.
 * 
 * @route POST /habits/goodHabit
 * @returns {Object} 200 - Renders the 'habitList' view with the good habits.
 * @returns {Object} 500 - Sends an error message if there is an internal server error.
 *
 */
router.post('/goodHabit', async (req, res) => {
    try {
        const goodHabits = await Habit.find({ email: req.user.email, good: true });
        res.render('habitList', { habits: goodHabits, good: true });
    } catch (err) {
        res.status(500).send("Error retrieving good habits");
    }
});

/**
 * Handles the GET request to retrieve all bad habits for the authenticated user.
 * 
 * This get fetches all habits associated with the authenticated user's email that are marked as bad
 * and renders the 'habitList' view with these habits.
 * 
 * @route GET /habit/badHabit
 * @middleware ensureAuthenticated - Middleware to ensure the user is authenticated before accessing this route.
 * @returns {Object} 200 - Renders the 'habitList' view with the bad habits.
 * @returns {Object} 500 - Sends an error message if there is an internal server error.
 */
router.get('/badHabit', ensureAuthenticated, async (req, res) => {
    try {
        const goodHabits = await Habit.find({ email: req.user.email, good: false });
        res.render('habitList', { habits: goodHabits, good: false});
    } catch (err) {
        res.status(500).send("Error retrieving bad habits");
    }
});

//same as post goodHabit
router.get('/goodHabit', ensureAuthenticated, async (req, res) => {
    try {
        const goodHabits = await Habit.find({ email: req.user.email, good: true });
        res.render('habitList', { habits: goodHabits, good: true });
    } catch (err) {
        res.status(500).send("Error retrieving good habits");
    }
});

//same as get badHabit
router.post('/badHabit', async (req, res) => {
    try {
        const goodHabits = await Habit.find({ email: req.user.email, good: false });
        res.render('habitList', { habits: goodHabits, good: false});
    } catch (err) {
        res.status(500).send("Error retrieving bad habits");
    }
});

//Simply redirects to habitAdd.ejs
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

/**
 * Helper method for calculating frequency ratios.
 * 
 * @param {String} timeRange 
 * @returns returns a number based on the time range inputed. Week = 7, month = 30, year = 365.
 */
const calculateIntervalCount = (timeRange) => {
    switch (timeRange) {
        case 'week':
            return DAYSINWEEK;
        case 'month':
            return DAYSINMONTH;
        case 'year':
            return DAYSINYEAR;
        default:
            throw new Error('Invalid time range');
    }
}

/**
 * Handles the POST request to calculate frequency ratios for good or bad habits within a specified time range.
 * 
 * Logically this code calculates how consistent a user has been depending on their habit.frequency and returning it as a percentage.
 * Taking the numerator as all the times the user has done a habit and dividing it by the overall theoretically possible amount of times
 * they could have done the habit.
 * 
 * This post fetches habits associated with the authenticated user's email and specified habit type (good or bad).
 * It calculates the frequency ratios over a given time range (week, month, or year) and returns the ratios as percentages.
 * 
 * @route POST /getFrequencyRatios
 * @middleware ensureAuthenticated - Middleware to ensure the user is authenticated before accessing this route.
 * @param {string} req.body.goodOrBad - The type of habit to filter by (true for good habits, false for bad habits).
 * @param {string} req.body.timeRange - The time range to calculate frequency ratios ('week', 'month', or 'year').
 * @returns {Object} 200 - An object with success status and frequency ratios if the request is successful.
 * @returns {Object} 400 - An error message if the time range is invalid.
 * @returns {Object} 500 - An error message if there is an internal server error.
 *
 */
router.post('/getFrequencyRatios', ensureAuthenticated, async (req, res) => {
    try {
        const { goodOrBad, timeRange } = req.body;
        const now = new Date();
        
        let intervalCount;
        //Adding 1 to interval count to account for .length being 1 extra than the index.
        intervalCount = calculateIntervalCount(timeRange) + 1;
        const habits = await Habit.find({ email: req.user.email, good: goodOrBad });
        //This is an array because we dont just want a total percentage we want a percentage for every day in a given time range.
        const totalMaxFrequencies = new Array(intervalCount).fill(0);
        const totalFrequencies = new Array(intervalCount).fill(0);

        habits.forEach(habit => {
            /* If habit.frequency[frequency.length - 1] = today 
            * then from habit.frequency.length - intervalCount to habit.frequency.length - 1 = all values in the given time range.
            * Essentially since we know that each index in the array represents a specific date and that the last one is always today.
            * We can easily get all days starting at the ones the user requested. By simply doing .length - amount of days + 1.
            * Thats why we are doing habit.frequency.length - interval count here.
            */
            const habitStartIndex = habit.frequency.length - intervalCount;
            const habitEndIndex = habit.frequency.length - 1;
            let isEmpty = false;
            for (let i = habitStartIndex; i <= habitEndIndex; i++) {
                //index = i - habitStartIndex is because while a given habit may have been made after the requested date
                //We still wanna ensure we populate the array with 0 rather than NaN.
                const index = i - habitStartIndex;
                if (index >= 0 && index < intervalCount) {
                    //if the habit was recently made and no entry exists we must still add it to total max frequencies.
                    //but we cant add any to total frequencies so we skip it.
                    if(habit.frequency.length === 0 && !isEmpty){
                        //we use total max frequencies.length -1 since we know it was made today.
                        totalMaxFrequencies[totalMaxFrequencies.length - 1] += 1;
                        isEmpty = true;
                    }
                    if(!isNaN(habit.frequency[i])){
                        totalFrequencies[index] += habit.frequency[i];
                        totalMaxFrequencies[index] += 1;
                    }
                }
            }
        });
        // Calculate the frequency ratios as percentages for each interval.
        // For each index, divide the total frequency by the total maximum frequency and multiply by 100 to get the percentage.
        // If the total maximum frequency for an index is 0, set the ratio to 0 to avoid division by zero.
        const frequencyRatios = totalFrequencies.map((freq, index) => (totalMaxFrequencies[index] > 0 ? (freq / totalMaxFrequencies[index]) * 100 : 0));
        res.json({ success: true, frequencyRatios });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

/**
 * Handles the POST request to check for the existence of a habit with the same name or question for the authenticated user.
 * 
 * This post normalizes the habit name and question provided in the request body and checks if there are any existing habits
 * with the same name or question for the authenticated user's email and specified habit type (good or bad).
 * If a habit with the same name or question exists, it returns an error message; otherwise, it returns a success response.
 * 
 * @route POST /habit/existingHabitCheck
 * @middleware ensureAuthenticated - Middleware to ensure the user is authenticated before accessing this route.
 * @param {string} req.body.goodOrBad - The type of habit to filter by (true for good habits, false for bad habits).
 * @param {string} req.body.habit - The name of the habit to check for existence.
 * @param {string} req.body.question - The question associated with the habit to check for existence.
 * @returns {Object} 200 - A JSON object with an error status and message if a habit with the same name or question exists.
 * @returns {Object} 200 - A JSON object with an error status of false if no habit with the same name or question exists.
 */
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

/**
 * Handles the POST request to add a new habit for the authenticated user.
 * 
 * This post creates a new habit with the specified name, daily question, and type (good or bad).
 * The normalized version of habit name and question are made before storing in the database.
 * The habit is initialized with an empty frequency array, and the initial `whenToAsk` date is set to one second from now.
 * 
 * @route POST /habit/addAHabit
 * @middleware ensureAuthenticated - Middleware to ensure the user is authenticated before accessing this route.
 * @param {string} req.body.habit - The name of the habit to be added.
 * @param {string} req.body.question - The daily question associated with the habit.
 * @param {string} req.body.goodOrBad - A string representing whether the habit is good ('true') or bad ('false').
 * @returns {Object} 200 - A JSON object with a success status if the habit is successfully added.
 * @returns {Object} 500 - A JSON object with a success status of false and an error message if there is an internal server error.
 */
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

        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

//Simple get same as goodHabit or badHabit get. This one is for client side code that redirects
//with a query instead of a server call.
router.get('/habitList', async (req, res) => {
    const good = req.query.good === 'true';

    try {
        const habits = await Habit.find({ email: req.user.email, good: good });
        res.render('habitList', { habits: habits, good: good });
    } catch (err) {
        res.status(500).send("Error retrieving habits");
    }
});

module.exports = router;

