const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('interpersonal');
});
router.get('/select-scenario', (req, res) => {
    res.render('select_scenario');
});

module.exports = router;
