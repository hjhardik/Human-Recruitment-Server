//If want to use your own MONGODB database update the db password as follows:
//dbPassword = 'mongodb+srv://YOUR_USERNAME_HERE:'+ encodeURIComponent('YOUR_PASSWORD_HERE') + '@CLUSTER_NAME_HERE.mongodb.net/test?retryWrites=true';
dbPassword =
  "mongodb+srv://Hardik:Hardik@cluster0.wm86f.mongodb.net/test";

//export the database URI
module.exports = {
  mongoURI: dbPassword,
};
