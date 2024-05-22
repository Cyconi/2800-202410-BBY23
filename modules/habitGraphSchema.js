const mongoose = require('mongoose');

const habitGraphSchema = new mongoose.Schema({
    x_values_good: { type: [String], required: true },
    y_values_good: { type: [Number], required: true }, 
    x_values_bad: { type: [String], required: true },  
    y_values_bad: { type: [Number], required: true },  
    title: { type: String, required: true }            
});

const habitGraph = mongoose.model('habitGraph', habitGraphSchema);

module.exports = habitGraph;
