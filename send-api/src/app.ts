import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import passport from 'passport';
import { Strategy } from 'passport-http-bearer';
import { NODE_ENV, PORT, ORIGIN, CREDENTIALS } from '@config';
import { Routes } from '@interfaces/routes.interface';
import errorMiddleware from '@middlewares/error.middleware';

class App {
	public app: express.Application;
	public env: string;
	public port: string | number;

	constructor(routes: Routes[]) {
		this.app = express();
		this.env = NODE_ENV || 'development';
		this.port = PORT || 3000;

		this.initializeAuthentication();
		this.initializeMiddlewares();
		this.initializeRoutes(routes);
		this.initializeErrorHandling();
	}

	public listen() {
		this.app.listen(this.port, () => {
			console.debug(`=================================`);
			console.debug(`======= ENV: ${this.env} =======`);
			console.debug(`🚀 App listening on the port ${this.port}`);
			console.debug(`=================================`);
		});
	}

	public getServer() {
		return this.app;
	}

	private initializeAuthentication() {
		passport.use(
			'bearer',
			new Strategy((token, done) => {
				const { BEARER_TOKENS } = process.env;
				if (!BEARER_TOKENS) {
					return done(new Error('server has no bearer tokens'));
				}

				const authenticated = BEARER_TOKENS.split(',').some((v) => token === v);
				if (!authenticated) {
					return done(null, false);
				}

				return done(null, {}, { scope: 'all' });
			}),
		);

		this.app.use(passport.initialize());
	}

	private initializeMiddlewares() {
		this.app.use(
			morgan('dev', {
				stream: {
					write: (message: string) => {
						console.debug(message.substring(0, message.lastIndexOf('\n')));
					},
				},
			}),
		);
		this.app.use(cors({ origin: ORIGIN, credentials: CREDENTIALS }));
		this.app.use(hpp());
		this.app.use(helmet());
		this.app.use(express.json());
		this.app.use(express.urlencoded({ extended: true }));
	}

	private initializeRoutes(routes: Routes[]) {
		routes.forEach((route) => {
			this.app.use('/', route.router);
		});
	}

	private initializeErrorHandling() {
		this.app.use(errorMiddleware);
	}
}

export default App;
