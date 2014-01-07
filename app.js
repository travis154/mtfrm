
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var MongoStore = require('connect-mongo')(express);
  
var conf = require('./conf');

var sessionStore = new MongoStore({db:conf.db});
var UserSchema = require('./lib/Schema').User;

//models
var db = mongoose.connect("mongodb://127.0.0.1/" + conf.db);
var User = db.model('user', UserSchema);

//create admin user if not exist
User.createIfNotExists({username:'test', password:'test'});


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
  done(null, id);
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
	res.render('index');
});

app.get('/login', function(req,res){
	res.render('login');
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
