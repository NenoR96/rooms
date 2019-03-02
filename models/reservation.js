const mongoose = require('mongoose');
// const User = require('../models/user');

const ReservationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true},
    room: { type: mongoose.Schema.Types.ObjectId, required: true},
    from: { type: String, required: true},
    to: { type: String, required: true},
    state: {type: Number, required: true}
});

const Reservation = module.exports = mongoose.model('Reservation', ReservationSchema);