var mongoose = require('mongoose');
var crypto = require('crypto');
var conf = require('../conf');

var User = mongoose.Schema({
	username:{type:"string", unique:true},
	password:"string"
});

User.pre('save', function (next) {
	//hash password
	this.password = crypto.createHash("sha1").update(this.password + conf.hash).digest("hex");
	next();
});

User.statics.createIfNotExists = function(obj, fn){
	var u = new this(obj);
	u.save(fn);
}

User.statics.authenticate = function(obj, fn){
	this.findOne({
		username:obj.username, 
		password:crypto.createHash("sha1").update(obj.password + conf.hash).digest("hex")
	}, fn);
}

exports.User = User;
