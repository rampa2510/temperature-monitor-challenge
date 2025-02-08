let generatorInterval: NodeJS.Timeout | null = null;

interface TemperatureReading {
	id: string;
	temperature: number;
	timestamp: string;
}

function generateTemperature(): number {
	return 15 + parseFloat(Math.random().toPrecision(2)) * 15; // Between 15-30°C
}

export function startGenerator(callback: (reading: TemperatureReading) => void) {
	if (generatorInterval) return;

	generatorInterval = setInterval(() => {
		const reading = {
			id: crypto.randomUUID(),
			temperature: generateTemperature(),
			timestamp: new Date().toISOString()
		};
		callback(reading);
	}, 2000);
}

export function stopGenerator() {
	if (generatorInterval) {
		clearInterval(generatorInterval);
		generatorInterval = null;
	}
}
