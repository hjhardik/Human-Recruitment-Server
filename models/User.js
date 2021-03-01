const mongoose = require("mongoose");
//creating user schema to store user info in database
const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
  },
  userName: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  candidate:{
    //true for candidate, false for company
    type: Boolean,
    default: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

//creating model
const User = mongoose.model("User", userSchema);
//exporting model
module.exports = User;
