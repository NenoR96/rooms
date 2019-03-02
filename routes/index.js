const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Room = require('../models/room');
const Reservation = require('../models/reservation');
const config = require('../config/config');
router.get('/', function(req, res) {
    Room.find({}, function(err, room) {
            if(err) return res.send('no rooms found');
            var sobe = [];
            var mjera = 3;
            for (var i = 0; i < room.length; i += mjera) {
                sobe.push(room.slice(i, i + mjera));
            }
            res.render("index", { rooms: sobe });   
    });
});

router.get('/confirmation/:token', ensureAuthenticated, function(req, res) {
    jwt.verify(req.params.token, config.esecret, function(err, tok) {
        if(err) throw err;
        Reservation.findByIdAndUpdate(tok.reserv, { state: 1 }, function(err, reserv){
            res.redirect('/user/profile/' + req.user._id);
        });
    });
});


function ensureAuthenticated(req, res, next){
    if(req.isAuthenticated()){
      return next();
    } else {
      res.redirect('/user/login');
    }
  }

module.exports = router;