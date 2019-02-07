module.exports = function(n){
  let mongoose = require("mongoose");
  let Schema = mongoose.Schema;
  let bcrypt = require("bcrypt");


  let SALT_WORK_FACTOR = n.config.Users.SALT_WORK_FACTOR;
  let MAX_LOGIN_ATTEMPS = n.config.Users.MAX_LOGIN_ATTEMPS;
  let LOCK_TIME = n.config.Users.LOCK_TIME;

  //modelos
  let Users;
  // Users
  let UserSchema = new Schema({
    username: {type: String, required: true, index: {unique: true}},
    password: {type: String, required: true, select: false},
    level: {type: Number, required: true, default: 1}, // 0 admin, 1 common, -1 anonymous
    loginAttemps: {type: Number, required: true, default: 0},
    lockUntil: {type: Number}
  });

  UserSchema.virtual('isLocked').get(function() {
    // check for a future lockUntil timestamp
    return !! (this.lockUntil && this.lockUntil > Date.now());
  });

  UserSchema.pre('save', function(next){
    let user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt){
      if (err) return next(err);

      // hash the password along with our new salt
      bcrypt.hash(user.password, salt, function(err, hash){
        if (err) return next(err);
        // override the cleartext password with the hashed one
        user.password = hash;
        next();
      });
    });
  });

  UserSchema.methods.comparePassword = function(candidatePassword, callback) {
    Users.findById(this.id, {'password':1})
      .exec(function(err, user) {
      if(err) return callback(err);
      bcrypt.compare(candidatePassword, user.password, function(err, isMatch){
        if (err) return callback(err);
        callback(null, isMatch);
      });
    });
  };

  UserSchema.methods.incLoginAttempts = function(callback){
    // if have a previus lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil > Date.now()){
      return this.updateOne({
        $set: {loginAttemps: 1},
        $unset: {lockUntil: 1}
      }, callback);
    }
    // otherwise we're incrementing
    let updates = {$inc: {loginAttemps: 1}};
    // lock  the account if we've reached max attempts and it's not locked already
    if (this.loginAttemps + 1 >= MAX_LOGIN_ATTEMPS && !this.isLocked){
      updates.$set = {lockUntil: Date.now() + LOCK_TIME};
    }
    return this.updateOne(updates, callback);
  };

  let reasons = UserSchema.statics.failedLogin = {
    NOT_FOUND: 0,
    PASSWORD_INCORRECT: 1,
    MAX_ATTEMPTS: 2
  };

  UserSchema.statics.getAuthenticated = function(username, password, callback) {

    Users
      .findOne({username: username}, {'_id':1, 'username':1, 'level':1})
      .exec(function(err, user) {
      if (err) return callback(err);
      // make sure the user exist
      if (!user)
        return callback(null, null, { reason : reasons.NOT_FOUND});

      // check if account is currently locked
      if (user.isLocked){
        // just increment loginattemps if account is already locked
        return user.incLoginAttempts(function(err) {
          if (err) return callback(err);
          return callback(null, null, {reason: reasons.MAX_ATTEMPTS});
        });
      }

      // test for a maching password
      user.comparePassword(password, function(err, isMatch) {
        if (err) return callback(err);

        // check if the passwrd has match
        if (isMatch){
          // if there's no lock or failed attempts, just return the user
          if (!user.loginAttemps && !user.lockUntil) return callback(null, user, {reason: -1});
          // reset attempts and lock info
          let updates = {
            $set: {loginAttemps: 0},
            $unset: {lockUntil: 1}
          };
          return user.updateOne(updates, function(err) {
            if (err) return callback(err);
            return callback(null, user, {reason: -1});
          });
        }
        // passwor is incorrect, so increment login attempts before responding
        user.incLoginAttempts(function(err) {
          if (err) return callback(err);
          return callback(null, null, {reason: reasons.PASSWORD_INCORRECT});
        });
      });
    });
    //callback(null, null, {reason:-1});
  };

  Users = mongoose.model('Users', UserSchema);

  return Users;
};
