import { WebSocket } from 'ws';
import { buildApp } from '../../index';
import { FastifyInstance } from 'fastify';
import { describe, beforeAll, afterAll, expect, it } from 'vitest'
import { config } from '@/config/env';

describe('WebSocket Tests', () => {
	let app: FastifyInstance;
	const API_KEY = config.API_KEY;
	const WS_URL = `ws://localhost:${config.PORT}/ws`;

	beforeAll(async () => {
		app = await buildApp();

		app.listen({
			port: parseInt(config.PORT, 10),
			host: '0.0.0.0'
		});
	});

	afterAll(async () => {
		await app.close();
	});

	it.concurrent('should connect with valid API key', () => {
		const ws = new WebSocket(WS_URL, {
			headers: { 'api-key': API_KEY }
		});

		ws.on('open', () => {
			expect(ws.readyState).toBe(WebSocket.OPEN);
			ws.close();
		});
	});

	it.concurrent('should reject connection without API key', () => {
		const ws = new WebSocket(WS_URL);

		ws.on('error', () => {
			expect(ws.readyState).toBe(WebSocket.CLOSED);
		});
	});

	it.concurrent('should receive temperature readings', () => {
		const ws = new WebSocket(WS_URL, {
			headers: { 'api-key': API_KEY }
		});

		ws.on('message', (data) => {
			const message = JSON.parse(data.toString());
			if (message.type === 'temperature_reading') {
				expect(message.payload).toHaveProperty('temperature');
				expect(message.payload).toHaveProperty('id');
				expect(message.payload).toHaveProperty('timestamp');
				expect(message.payload.temperature).toBeGreaterThanOrEqual(15);
				expect(message.payload.temperature).toBeLessThanOrEqual(30);
				ws.close();
			}
		});
	});
});
