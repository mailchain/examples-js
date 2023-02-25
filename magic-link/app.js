require('dotenv').config();

var path = require('path');
var createError = require('http-errors');
var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require('passport');
var session = require('express-session');
var SQLiteStore = require('connect-sqlite3')(session);

var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth'); // require your auth route

var initializeMagicLink = require('./magicLink');
initializeMagicLink();

var app = express();

app.locals.pluralize = require('pluralize');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(
	session({
		secret: process.env.SECRET_PASSPORT_SESSION_KEY,
		resave: false,
		saveUninitialized: false,
		store: new SQLiteStore({ db: 'sessions.db', dir: './var/db' }),
	}),
);

app.use(passport.authenticate('session'));

app.use('/', indexRouter);
app.use('/', authRouter); // app should 'use' your auth router

// catch 404 and forward to error handler
app.use((req, res, next) => {
	next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;
