require('dotenv').config();
const express=require("express");
const bodyParser=require("body-parser");
const fileUpload = require("express-fileupload");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const fs=require("fs");
app=express();
app.use(express.static("public"));
app.use(fileUpload());
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

const filesSchema=new mongoose.Schema({
  filename:String
});
const userSchema = new mongoose.Schema ({
 
  username:String,
  name:String,
  googleId: String,
  view:[filesSchema],
  download:[filesSchema],
  delete:[filesSchema]
  
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
const File = new mongoose.model("File", filesSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/basefile",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    //console.log(profile);

    User.findOrCreate({username:profile.emails[0].value}, function (err, user) {
      
      //console.log(user);
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res){
  res.render("login");
});
app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile","email"] })
);
app.get("/auth/google/basefile",
  passport.authenticate('google', { failureRedirect: "/" }),
  function(req, res) {
    
    res.redirect("/options");
  });
  app.get("/options", function(req, res){
    if (req.isAuthenticated()){
      res.render("options");
    } else {
      res.redirect("/");
    }
    
  });
   
app.get("/index", function(req,res){
  if (req.isAuthenticated()){
    res.render("index");
  } else {
    res.redirect("/");
  }
  
    
});
app.post("/index",function(req,res){
    const username=req.body.username;
    if(req.files){
    const file = req.files.fil;
  const path = __dirname + "/public/uploads/" + file.name;
  User.find({username:username}, function(err,user){
    if(user.length===0){
      const usr=new User({
        username:username,
      });

      const fle=new File({
        filename:file.name
      })

     
      if(req.body.view==='on'){
        usr.view.push(fle);
      
      }
      if(req.body.download==='on'){
        usr.download.push(fle);
        
      }
      if(req.body.delete==='on'){
        usr.delete.push(fle);
        
      }
      usr.save();
      console.log(usr);
      file.mv(path, (err) => {
        if (err) {
        res.status(500).send(err);
        }
        res.redirect("/");
      });

    }
    else{
      

      const fle=new File({
        filename:file.name
      })

     
      if(req.body.view==='on'){
        user[0].view.push(fle);
      
      }
      if(req.body.download==='on'){
        user[0].download.push(fle);
        
      }
      if(req.body.delete==='on'){
        user[0].delete.push(fle);
        
      }
      user[0].save();
      file.mv(path, (err) => {
        if (err) {
          res.status(500).send(err);
        }
         res.redirect("/");
      });

    }
  });
  
}
else{
    res.redirect("/index");
}
});
app.get("/success",function(req,res){
  res.render("success");
})
app.get("/dvd",function(req,res){

  if (req.isAuthenticated()){
    const name=req.user.username;
    const vew=req.user.view;
    const del=req.user.delete;
    console.log(del);
    res.render("dvd",{name:name,view:vew, download:req.user.download,deleteArray:del});
  } else {
    res.redirect("/");
  }
})
app.get("/vew/:postman",function(req,res){

    const fileName=req.params.postman;
    res.sendFile(__dirname+"/public/uploads/"+fileName);
})
app.get("/dwnload/:postman",function(req,res){
    const fileName=req.params.postman;
    
    res.download(__dirname+"/public/uploads/"+fileName);
})
app.get("/dlete/:postman",function(req,res){
  const fileName=req.params.postman;
  const path=__dirname+"/public/uploads/"+fileName;
  try {
    fs.unlinkSync(path)
    //file removed
  } catch(err) {
    console.error(err)
  }
})



app.listen(3000,function(req,res){
    console.log("Server Listen at 3000");
})
