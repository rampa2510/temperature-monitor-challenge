import { WebSocket } from 'ws';
import { buildApp } from '../../index';
import { FastifyInstance } from 'fastify';
import { describe, beforeAll, afterAll, expect, it } from 'vitest';
import { config } from '@/config/env';

describe('WebSocket Tests', () => {
	let app: FastifyInstance;
	const API_KEY = config.API_KEY;
	const PORT = parseInt(config.PORT, 10);
	const WS_URL = `ws://0.0.0.0:${PORT}/ws`;

	beforeAll(async () => {
		app = await buildApp();
		await app.listen({
			port: PORT,
			host: '0.0.0.0'
		});
	});

	afterAll(async () => {
		await app.close();
	});

	// Helper function to create a promise that resolves when WS connects
	const waitForOpen = (ws: WebSocket) =>
		new Promise<void>((resolve, reject) => {
			const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
			ws.on('open', () => {
				clearTimeout(timeout);
				resolve();
			});
			ws.on('error', (error) => {
				clearTimeout(timeout);
				reject(error);
			});
		});

	// Helper function to wait for a specific message type
	const waitForMessageType = (ws: WebSocket, type: string, timeoutMs = 10000) =>
		new Promise<any>((resolve, reject) => {
			const timeout = setTimeout(() => {
				ws.off('message', onMessage);
				reject(new Error(`Timeout waiting for message type: ${type}`));
			}, timeoutMs);

			const onMessage = (data: any) => {
				try {
					const message = JSON.parse(data.toString());
					if (message.type === type) {
						clearTimeout(timeout);
						ws.off('message', onMessage);
						resolve(message);
					}
				} catch (error) {
					clearTimeout(timeout);
					ws.off('message', onMessage);
					reject(error);
				}
			};

			ws.on('message', onMessage);
			ws.on('error', (error) => {
				clearTimeout(timeout);
				ws.off('message', onMessage);
				reject(error);
			});
			ws.on('close', () => {
				clearTimeout(timeout);
				ws.off('message', onMessage);
				reject(new Error('WebSocket closed before receiving message'));
			});
		});

	it('should connect with valid API key', async () => {
		const ws = new WebSocket(WS_URL, {
			headers: { 'api-key': API_KEY }
		});

		await waitForOpen(ws);
		expect(ws.readyState).toBe(WebSocket.OPEN);
		ws.close();
	});

	it('should reject connection without API key', async () => {
		const ws = new WebSocket(WS_URL);

		try {
			await waitForOpen(ws);
			throw new Error('Should not connect');
		} catch {
			expect(ws.readyState).toBe(WebSocket.CLOSED);
		}
	});

	it('should receive temperature readings', async () => {
		const ws = new WebSocket(WS_URL, {
			headers: { 'api-key': API_KEY }
		});

		await waitForOpen(ws);
		const message = await waitForMessageType(ws, 'temperature_reading');

		expect(message.type).toBe('temperature_reading');
		expect(message.payload).toHaveProperty('temperature');
		expect(message.payload).toHaveProperty('id');
		expect(message.payload.temperature).toBeGreaterThanOrEqual(15);
		expect(message.payload.temperature).toBeLessThanOrEqual(30);

		ws.close();
	});

	it('should process temperature readings through n8n successfully', async () => {
		const ws = new WebSocket(WS_URL, {
			headers: { 'api-key': API_KEY }
		});

		try {
			await waitForOpen(ws);

			// Wait for initial temperature reading
			const tempReading = await waitForMessageType(ws, 'temperature_reading', 10000);
			expect(tempReading.type).toBe('temperature_reading');

			// Wait for processed reading
			const processedReading = await waitForMessageType(ws, 'processed_reading', 10000);
			expect(processedReading.type).toBe('processed_reading');
			expect(processedReading.payload).toHaveProperty('id');
			expect(processedReading.payload).toHaveProperty('temperature');
			expect(processedReading.payload).toHaveProperty('status');
			expect(processedReading.payload).toHaveProperty('processedAt');
			expect(['NORMAL', 'HIGH']).toContain(processedReading.payload.status);
		} finally {
			ws.close();
		}
	}, 30000);

	it('should handle n8n processing errors when n8n is down', async () => {
		// Temporarily change n8n URL to simulate n8n being down
		const originalUrl = config.N8N_WEBHOOK_URL;
		config.N8N_WEBHOOK_URL = 'http://nonexistent:1234/webhook';

		const ws = new WebSocket(WS_URL, {
			headers: { 'api-key': API_KEY }
		});

		try {
			await waitForOpen(ws);
			const temperatureReading = await waitForMessageType(ws, 'temperature_reading');
			const errorMessage = await waitForMessageType(ws, 'error');

			expect(temperatureReading.type).toBe('temperature_reading');
			expect(errorMessage.type).toBe('error');
			expect(errorMessage.payload).toBe('Failed to process temperature reading');
		} finally {
			config.N8N_WEBHOOK_URL = originalUrl;
			ws.close();
		}
	}, 10000);
});
