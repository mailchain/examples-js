import { Router } from 'express';
import passport from 'passport';
import { Routes } from '@interfaces/routes.interface';
import MailController from '@/controllers/mail.controller';

class AuthenticatedMailRoute implements Routes {
	public router = Router();
	private readonly _mailController: MailController;

	constructor() {
		this._mailController = new MailController();
		this.initializeRoutes();
	}

	private initializeRoutes() {
		this.router.post('/send', passport.authenticate('bearer', { session: false }), this._mailController.postMail);
	}
}

export default AuthenticatedMailRoute;
