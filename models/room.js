const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  type:{ type: String, required: true },
  number:{ type: Number, required: true },
  beds:{ type: Number, required: true },
  capacity:{ type: Number, required: true },
  cost:{ type: Number, required: true },
  reservation: [ {type: mongoose.Schema.Types.ObjectId, required: false} ],
  img: { type: String, required: true },
  images: [ {type: String, required: false} ]
});

const Room = module.exports = mongoose.model('Room', RoomSchema);
