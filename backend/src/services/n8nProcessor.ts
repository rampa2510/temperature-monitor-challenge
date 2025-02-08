import { FastifyBaseLogger, } from 'fastify';
import { TemperatureReading, ProcessedReading } from '../types/temperature';
import { config } from '@/config/env';

const N8N_AUTH = 'Basic dGVzdDp0ZXN0';
const TIMEOUT = 5000;

const parseResponse = (responseText: string): ProcessedReading => {
	try {
		return JSON.parse(responseText);
	} catch (e) {
		throw new Error(`Invalid JSON response from n8n: ${responseText}`);
	}
};

const handleError = (error: unknown, logger: FastifyBaseLogger): void => {
	if (error instanceof Error && error.name === 'AbortError') {
		logger.error('n8n request timed out after 5 seconds');
	} else {
		logger.error('Error processing temperature reading:', {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined
		});
	}
};

export const processReading = async (
	reading: TemperatureReading,
	logger: FastifyBaseLogger
): Promise<ProcessedReading> => {
	logger.info('Sending request to n8n:', {
		url: config.N8N_WEBHOOK_URL,
		reading
	});

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), TIMEOUT);

	try {
		const response = await fetch(config.N8N_WEBHOOK_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': N8N_AUTH
			},
			body: JSON.stringify(reading),
			signal: controller.signal
		}).finally(() => clearTimeout(timeout));

		const responseText = await response.text();
		logger.info('n8n response:', {
			status: response.status,
			statusText: response.statusText,
			body: responseText
		});

		if (!response.ok) {
			throw new Error(`n8n processing failed: ${response.status} ${response.statusText} - ${responseText}`);
		}

		return parseResponse(responseText);
	} catch (error) {
		handleError(error, logger);
		throw error;
	}
};
