//If want to use your own MONGODB database update the db password as follows:
//dbPassword = 'mongodb+srv://YOUR_USERNAME_HERE:'+ encodeURIComponent('YOUR_PASSWORD_HERE') + '@CLUSTER_NAME_HERE.mongodb.net/test?retryWrites=true';
//mongodb+srv://Hardik:<password>@cluster0.wm86f.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
dbPassword =
  mongodb+srv://Hardik:<password>@cluster0.wm86f.mongodb.net/myFirstDatabase?retryWrites=true&w=majority

//export the database URI
module.exports = {
  mongoURI: dbPassword,
};
