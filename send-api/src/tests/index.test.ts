import request from 'supertest';
import IndexRoute from '@routes/index.route';
import App from '@/app';

afterAll(async () => {
	await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));
});

describe('Testing Index', () => {
	describe('[GET] /', () => {
		it('response statusCode 200', () => {
			const indexRoute = new IndexRoute();
			const app = new App([indexRoute]);

			return request(app.getServer()).get(`${indexRoute.path}`).expect(200);
		});
	});
});
