const express = require('express');
const router = express.Router();
const fs = require('fs'), path = require('path');
const Room = require('../models/room');
const Reservation = require('../models/reservation');

router.get('/', ensureAuthenticated, function (err, res) {
        Room.find({}, function (err, room) {
                if (err) return res.send('no rooms found');
                Reservation.find({}, function (err, reservation) {
                        if (err) return res.send('something went wrong');
                        if (!reservation) return res.send('no reservations found');
                        res.render("admin", { rooms: room, reservation: reservation });
                });
        });
});
//================================================================================================
router.get('/room', ensureAuthenticated, function (req, res) {
        res.render("rooms/add_room");
});

router.post('/room', ensureAuthenticated, function (req, res) {
        Room.count().then((count) => {
                let newRoom = new Room({
                        number: count + 1,
                        beds: req.body.beds,
                        capacity: req.body.capacity,
                        cost: req.body.cost,
                        type: req.body.type,
                });
                fromDir('./public/images/rooms', req.body.type).then(function (imgs) {
                        imgs.map(function (img) {
                                img = img.replace(/\\/g, "/").replace(/public/g, "")
                                if (img.includes("img1")) { newRoom.img = img; }
                                else { newRoom.images.push(img); }
                        });
                }).then(newRoom.save(function (err) {
                        if (err) { console.log(err); return; }
                        else { res.redirect('/room/reservation/' + newRoom._id); }
                }));
        });
});
//================================================================================================
function fromDir(startPath, filter) {
        if (!fs.existsSync(startPath)) {
                console.log("no dir ", startPath);
                return;
        }
        var data = [];
        var files = fs.readdirSync(startPath);
        for (var i = 0; i < files.length; i++) {
                var filename = path.join(startPath, files[i]);
                var stat = fs.lstatSync(filename);
                if (stat.isDirectory()) {
                        fromDir(filename, filter);
                }
                else if (filename.indexOf(filter) >= 0) {
                        data.push(filename);
                };
        };
        return new Promise((resolve, reject) => {
                resolve(data);
        });
}


function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
                return next();
        } else {
                res.redirect('/user/login');
        }
}

module.exports = router;