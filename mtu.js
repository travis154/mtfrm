
/**
 * Module dependencies.
 */
var _ = require('underscore');
var express = require('express');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');
var async = require('async');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var moment = require('moment');
var MongoStore = require('connect-mongo')(express);
  
var conf = require('./conf');

var sessionStore = new MongoStore({db:conf.db});
var Schema = require('./lib/Schema');

//models
var db = mongoose.connect("mongodb://127.0.0.1/" + conf.db);
var User = db.model('user', Schema.User);
var Member = db.model('member', Schema.Member);

//create admin user if not exist
User.createIfNotExists({username:'test', password:'test', name:'Test User', type:'supervisor'});


passport.use(new LocalStrategy({
		usernameField: 'username',
		passwordField: 'password',
		passReqToCallback: true
	},
	function(req, username, password, done) {
		User.authenticate({username:username, password:password}, function(err, res){
			if(err) return done(err);
			if(res){
				done(null, username);
			}else{
				done(null, false, {message: "Incorrect login details"});
			}
		});
	}
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(id, done) {
	User.findOne({username:id}, function(err, user){
		if(!err) done(null, user);
		else done(err, null)  
	})
});

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.cookieParser(conf.cookie_secret));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.session({ secret: conf.cookie_secret, store: sessionStore, cookie: { maxAge: 1000 * 60 * 60 * 7 * 1000 ,httpOnly: false, secure: false}}));
app.use(passport.initialize());
app.use(passport.session());
app.use(require('stylus').middleware({ src: __dirname + '/public' }));
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}
function authenticate(req,res,next){
	if (req.isAuthenticated()) { return next(); }
	if (req.xhr){
		return res.json({error:"authentication failed"});
	}else{
		return res.redirect('/login');
	}
}

app.get('/', authenticate, function(req,res){
	async.auto({
		count: function(fn){
			Member.count(fn);
		},
		latest_mem:function(fn){
			Member
			.findOne({},{business_name:1})
			.sort({_id:-1})
			.exec(function(err, doc){
				fn(err, doc.business_name);
			});
		}
	}, function(err, data){
		if(err) throw err;
		data.usertype = req.user.type.toLowerCase();
		res.render('index',data);
	});
});
app.get('/members', authenticate, function(req,res){
	Member
	.find()
	.sort({_id:-1})
	.lean()
	.exec(function(err, members){
		members = _.map(members,function(e){
			e.time = moment(e.time).format("Do MMM YY");
			return e;
		});
		res.render('members', {members:members});
	});
});
app.get('/members/register', authenticate, function(req,res){
	res.render('register');
});
app.post('/members/register', authenticate, function(req,res){
	var data = req.body;
	data.ip = req.ip;
	data.user = req.user;
	data.time = new Date()
	var mem = new Member(data);
	mem.save(function(err, member){
		if(err) throw err;
		res.json(member);
	});
});
app.get('/members/:id', authenticate, function(req,res){
	Member
	.findOne({_id:req.params.id})
	.lean()
	.exec(function(err, member){
		if(err) throw err;
		if(!member){
			return res.redirect('/members');
		}
		res.render('register', {member:member});
	});
});
app.del('/members/:id', authenticate, function(req,res){
	Member
	.remove({_id:req.params.id},function(err){
		res.json({success:1});
	});
});
app.post('/members/:id', authenticate, function(req,res){
	var id = req.params.id;
	var data = req.body;
	Member.update({_id:id}, data, function(err, member){
		if(err) throw err;
		res.json(member);
	});
});

app.get('/login', function(req,res){
	res.render('login');
});
app.get('/sms', authenticate, function(req,res){
	res.render('sms');
});
app.get('/user/password', authenticate, function(req,res){
	res.render('password');
});
app.post('/user/password', authenticate, function(req,res){
	var pass = req.body.password_new;
	User.changePassword({username:req.user, password:pass}, function(err, change){
		res.redirect('/logout');
	});
});
app.get('/users', authenticate, function(req,res){
	User
	.find()
	.sort({_id:-1})
	.lean()
	.exec(function(err, users){
		res.render('users', {users:users});
	});
});
app.del('/user/:id', authenticate, function(req,res){
	User
	.remove({_id:req.params.id},function(err){
		res.json({success:1});
	});
});
app.get('/user/add', authenticate, function(req,res){
	res.render('user-add');
});
app.post('/user/add', authenticate, function(req,res){
	var data = req.body;
	data.password = "welcome";
	data.ip = req.ip;
	data.user = req.user;
	data.time = new Date()
	var user = new User(data);
	user.save(function(err, user){
		if(err) throw err;
		res.json(user);
	});
});

app.post(
	'/login',
	passport.authenticate('local', {
		successRedirect:'/',
		failureRedirect:'/login'
	})
);

app.get('/logout', function(req, res){
	req.logout();
	res.redirect('/login');
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
