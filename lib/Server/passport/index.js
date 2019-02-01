const passport  = require("passport");
const localStrategy = require("passport-local").Strategy;

module.exports = function(app){

  let db = app.get("DB");
  let sio = app.get("sio");

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser(function(user, done){
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done){
    db.Users.findById(id, function(err, user){
      done(err, user);
    });
  });

  passport.use('local' , new localStrategy({
    usernameField: "username",
    passwordField: "password",
  }, db.Users.getAuthenticated));

  app.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
      if(err) return next(err);
      if(!user){
        delete req.session.user;
        console.log("[login] user:", user.name, "fail! reason:", info.reason);
        res.json({success: false, reason: info.reason});
      } else {
        req.session.user = user;
        req.logIn(user, function(err){
          if(err) return next(err);
          console.log("[login] user:", user.username, "ok!");
          res.json({success: true, user: user, reason: info.reason});
        });
      }
    })(req, res, next);
  });

  app.get('/logout', function(req, res){
    req.logout();
    if(req.session.user) delete req.session.user
    res.json({success: true});
  });

  app.set("passport0", passport);

};
