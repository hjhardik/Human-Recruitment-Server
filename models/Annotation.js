const mongoose = require("mongoose");
//creating annotation schema
const annotationSchema = new mongoose.Schema({
  //same as unique id of data object
  id: {
    type: String,
    required: true,
  },
  // data object which will eventually be used as annotations
  data: {
    type: Object,
    required: true,
  },
  //file location of the parent file of annotations
  fileId: {
    type: String,
    required: true,
  },
});

//creating annotation model
const Annotation = mongoose.model("Annotation", annotationSchema);
//export the model
module.exports = Annotation;
