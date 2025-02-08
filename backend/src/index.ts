import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { config } from './config/env';

const port = config.PORT || 4000;

// Create HTTP server for health endpoint
const server = createServer((req, res) => {
	if (req.url === '/health') {
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ status: 'ok' }));
		return;
	}
	res.writeHead(404);
	res.end();
});

// Create WebSocket server attached to HTTP server
const wss = new WebSocketServer({ server });

// WebSocket connection handler
wss.on('connection', (ws) => {
	console.log('New client connected');

	// Send welcome message
	ws.send('Welcome to the WebSocket server!');

	// Handle incoming messages
	ws.on('message', (message) => {
		console.log(`Received message: ${message}`);
		// Echo the message back to client
		ws.send(`Server received: ${message}`);
	});

	// Handle client disconnection
	ws.on('close', () => {
		console.log('Client disconnected');
	});

	// Handle connection errors
	ws.on('error', (error) => {
		console.error('WebSocket error:', error);
	});
});

// Start server
server.listen(port, () => {
	console.log(`Server running on port ${port}`);
	console.log(`WebSocket server is ready`);
});
