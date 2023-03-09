import { NextFunction, Request, Response } from 'express';
import mailService from '@services/mail.service';

class MailController {
	public mailService = new mailService();

	public postMail = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
		try {
			const { data: sendResult, error } = await this.mailService.send(req.body);
			if (error) {
				return res.status(500).json({ error: error.message });
			}

			return res.status(200).json({ status: sendResult.status });
		} catch (error) {
			next(error);
		}
	};
}

export default MailController;
