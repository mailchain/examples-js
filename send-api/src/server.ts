import IndexRoute from '@routes/index.route';
import AuthenticatedMailRoute from './routes/authenticated-mail.route';
import App from '@/app';

const app = new App([new IndexRoute(), new AuthenticatedMailRoute()]);

app.listen();
