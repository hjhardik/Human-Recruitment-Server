const mongoose = require("mongoose");
const contractSchema = new mongoose.Schema({
  contractName: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  members:{
    type: Array,
    required: true,
  },
  creator: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

//creating model
const Contract = mongoose.model("Contract", contractSchema);
//exporting model
module.exports = Contract;
