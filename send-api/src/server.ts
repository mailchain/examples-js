import App from '@/app';
import IndexRoute from '@routes/index.route';
import validateEnv from '@utils/validateEnv';
import MailRoute from './routes/mail.route';

validateEnv();

const app = new App([new IndexRoute(), new MailRoute()]);

app.listen();
