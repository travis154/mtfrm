var mongoose = require('mongoose');
var crypto = require('crypto');
var conf = require('../conf');
var request = require('request');
var async = require('async');
var conf = require('../conf');
var User = mongoose.Schema({
	name:'string',
	username:{type:"string", unique:true},
	password:"string",
	type:{type:'string', default:'normal'},
	time:'date',
	user:'string',
	ip:'string'
});

User.pre('save', function (next) {
	//hash password
	this.password = crypto.createHash("sha1").update(this.password + conf.hash).digest("hex");
	this.username = this.username.toLowerCase();
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
User.statics.changePassword = function(obj, fn){
	var password = crypto.createHash("sha1").update(obj.password + conf.hash).digest("hex");
	this.update({username:obj.username},{$set:{password:password}},fn);
}

var Member = mongoose.Schema({
	business_name:'string',
	business_reg:'string',
	business_addr:'string',
	business_phone:'string',
	business_fax:'string',
	business_email:'string',
	business_website:'string',
	business_type:'string',
	business_nature:'string',
	personal_name:'string',
	personal_id:'string',
	personal_mobile:'string',
	personal_sex:'string',
	personal_permanent_addr:'string',
	personal_current_addr:'string',
	personal_email:'string',
	membership:'string',
	active:{type:'boolean', default:true},
	recieved_date:'date',
	time:'date',
	user:'string',
	ip:'string'
});

var SMS = mongoose.Schema({
	message:'string',
	recipients_type:'string',
	recipients:[{type:mongoose.Schema.Types.ObjectId, ref:'Member'}],
	time:'date',
	user:'string',
	ip:'string'
});


exports.SMS = SMS;
exports.User = User;
exports.Member = Member;
