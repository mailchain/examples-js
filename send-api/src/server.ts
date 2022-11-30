import IndexRoute from '@routes/index.route';
import MailRoute from './routes/mail.route';
import App from '@/app';

const app = new App([new IndexRoute(), new MailRoute()]);

app.listen();
