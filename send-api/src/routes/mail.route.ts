import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import MailController from '@/controllers/mail.controller';

class MailRoute implements Routes {
  public path = '/send';
  public router = Router();
  private mailController: MailController;
  constructor() {
    this.mailController = new MailController();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, this.mailController.postMail);
  }
}

export default MailRoute;
