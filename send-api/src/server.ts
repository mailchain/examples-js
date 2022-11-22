import App from '@/app';
import IndexRoute from '@routes/index.route';
import MailRoute from './routes/mail.route';

const app = new App([new IndexRoute(), new MailRoute()]);

app.listen();
