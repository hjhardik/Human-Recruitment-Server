const mongoose = require("mongoose");
const copyContractSchema = new mongoose.Schema({
  contractName: {
    type: String,
    required: true,
  },
  draftContent:{
    type:String,
  },
  creator:{
    type: String,
    required: true,
  },
  company:{
    type: String,
    required: true,
  },
  pdfName: {
    type: String,
    required: true,
  },
  candidateName: {
    type: String,
    required: true,
  },
  // 0:DRAFT, 1:FINALIZED, 2:APPROVBYCAND, 3:APPROVBYCOMP, 4:APPROVED, 5:SIGNED BY COMPANY, 6.SIGNED
  status:{
    type: Number,
    default: 0,
  },
  agreementId:{
    type:String,
    default:null
  },
  signingUrl:{
    type:String,
    default: null
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

//creating model
const CopyContract = mongoose.model("contractCopy", copyContractSchema);
//exporting model
module.exports = CopyContract;
