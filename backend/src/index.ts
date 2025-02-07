import express from 'express';
import { config } from './config/env';

const app = express();
const port = config.PORT || 4000;

app.get('/health', (req, res) => {
	res.json({ status: 'ok' });
});

app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
