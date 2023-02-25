var express = require('express');
var passport = require('passport');
var router = express.Router();

router.get('/login', (req, res, next) => {
	res.render('login');
});

router.post(
	'/login/mailchain',
	passport.authenticate('magiclink', {
		action: 'requestToken',
		failureRedirect: '/login',
	}),
	(req, res, next) => {
		res.redirect('/login/mailchain/check');
	},
);

router.get('/login/mailchain/check', (req, res, next) => {
	res.render('login/mailchain/check');
});

router.get(
	'/login/mailchain/verify',
	passport.authenticate('magiclink', {
		successReturnToOrRedirect: '/',
		failureRedirect: '/login',
	}),
);
router.post('/logout', (req, res, next) => {
	req.logout((err) => {
		if (err) {
			return next(err);
		}
		res.redirect('/');
	});
});
module.exports = router;
