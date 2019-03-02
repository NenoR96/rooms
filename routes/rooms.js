const express = require('express');
const router = express.Router();
const moment = require('moment');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const Room = require('../models/room');
const Reservation = require('../models/reservation');
const config = require('../config/config');
//================================================================================================
router.get('/reservation/:id', function (req, res) {
  Room.findById(req.params.id).exec(function (err, room) {
    if (err) throw err;
    if (!room) return res.send('room doesnt exist');
    var state = false;
    var imgs = [];
    room.images.forEach(element => {
      imgs.push(element);
    });
    if (!req.query.start && !req.query.end) {
      res.render('rooms/room', { room: room, state: state, imgs: imgs });
    }
    else {
      state = true;
      res.render('rooms/room', { room: room, state: state, imgs: imgs, start: req.query.start, end: req.query.end });
    }
  });
});

router.post('/reservation', ensureAuthenticated, function (req, res) {
  var start = req.body.start.split("-").reverse().join("-");
  var end = req.body.end.split("-").reverse().join("-");
  var brRez = 0, bezRez = 0;
  Room.findById(req.body.room, function (err, room) {
    if (room.reservation.length > 0) {
      Reservation.find({ room: room._id, state: { $gt: 0 } }, function (err, reservs) {
        brRez += reservs.length;
      }).then(reservs => reservs.map(function (reserv) {
        var date = dateRange(start, end, reserv.from, reserv.to);
        if (date == true) {
          res.send("zauzeta");
          return true;
        }
        else {
          bezRez++;
        }
        console.log(brRez + " " + bezRez);
        if (bezRez == brRez) {
          arrangeReservation(room, req.user, start, end);
          res.send("go and check your email to confirm reservation");
        }
      }));
    }
    else {
      arrangeReservation(room, req.user, start, end);
      res.send("go and check your email to confirm reservation");
    }
  });
});
//================================================================================================
router.get('/search', function (req, res) {
  res.render("rooms/ser_room");
});

router.post('/search', function (req, res) {
  var start = req.body.start.split("-").reverse().join("-");
  var end = req.body.end.split("-").reverse().join("-");
  var soba = 0, load = 0, brRez = 0, bezRez = 0;
  var arr = [];
  Room.find({}).exec().then(rooms => rooms.map(function (room) {
    if (room.reservation.length > 0) {
      soba++;
      Reservation.find({ room: room._id, state: { $gt: 0 } }, function (err, reservs) {
        soba--; brRez += reservs.length;
      }).then(reservs => reservs.map(function (reserv) {
        var date = dateRange(start, end, reserv.from, reserv.to);
        if (date == true) {
          load++;
          arr.push(room._id);
        }
        else {
          if (calculateDays(reserv.to, getFormattedDate(new Date())) > 0) {
            reserv.state = 0;
            reserv.save(function (err) {
              if (err) throw err;
            });
          }
          bezRez++;
        }
        console.log(brRez + " " + load + " " + bezRez);
        if (load + bezRez == brRez && soba == 0) {
          var unique = arr.filter(onlyUnique);
          getData(rooms, unique).then(function (val) {
            var sobe = [], mjera = 3;
            for (var i = 0; i < val.length; i += mjera) {
              sobe.push(val.slice(i, i + mjera));
            }
            res.render("rooms/ser_rooms", { rooms: sobe, start: req.body.start, end: req.body.end });
          });
        }
      }));
    }
  }));
});
//===============================================================================================
function getData(rooms, ids) {
  return new Promise((resolve, reject) => {
    ids.map(function (num) {
      var sob = findIndexByID(rooms, num);
      rooms.splice(sob, 1);
    });
    resolve(rooms);
  });
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

function arrangeReservation(room, user, start, end) {
  let reservation = new Reservation({
    user: user._id,
    room: room._id,
    from: start,
    to: end,
    state: 2,
  });
  room.reservation.push(reservation._id);
  reservation.save(function (err) {
    if (err) throw error;
    room.save(function (err) {
      if (err) throw error;
      let token = jwt.sign({ username: user.username, reserv: reservation._id }, config.esecret, { expiresIn: '24h' });
      const url = `http://localhost:3000/confirmation/` + token;
      mailOptions.text = "Please click this email to confirm your email: " + url;
      mailOptions.to = user.email;
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
    });
  });
}

var transporter = nodemailer.createTransport({
  service: config.eservice,
  auth: {
    user: config.email,
    pass: config.epass
  }
});

var mailOptions = {
  from: config.email,
  to: 'nenor1995@gmail.com',
  subject: 'Reservation confirmation',
  text: ''
};

function getFormattedDate(date) {
  var year = date.getFullYear();
  var month = (1 + date.getMonth()).toString();
  month = month.length > 1 ? month : '0' + month;
  var day = date.getDate().toString();
  day = day.length > 1 ? day : '0' + day;

  return day + '-' + month + '-' + year;
}

function dateRange(start1, end1, start2, end2) {
  var dur = calculateDays(end2, start1);
  var dur1 = calculateDays(end1, start2);
  if (dur < 0 && dur1 < 0) {
    return true;
  }
  else if (dur > 0) {
    return null;
  }
}

function findIndexByID(array, id) {
  for (var i = 0; i < array.length; i++) {
    if (array[i]._id.equals(id)) {
      console.log(i + " " + id);
      return i;
    }
  }
  return null;
}

function calculateDays(startDate, endDate) {
  var start_date = moment(startDate, 'DD-MM-YYYY');
  var end_date = moment(endDate, 'DD-MM-YYYY');
  var duration = moment.duration(end_date.diff(start_date));
  var days = duration.asDays();
  return days;
}

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/user/login');
  }
}

module.exports = router;