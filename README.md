# Real-Time Temperature Monitoring System

A modern real-time temperature monitoring system built with React (Remix), Node.js, MongoDB, and n8n workflow automation.

## System Architecture
The system consists of four main components:
1. **Frontend (Remix)**
   - Real-time temperature display
   - Connection status indicator
   - Last 5 readings with timestamps
   - Status badges (NORMAL/HIGH)
   - Temperature range: 15-30°C
2. **Backend (Node.js + TypeScript)**
   - Temperature data generation (every 2 seconds)
   - WebSocket connections
   - Data processing and storage
   - API endpoints
3. **MongoDB**
   - Persistent storage for temperature readings
   - Historical data storage
4. **n8n**
   - Workflow automation
   - Temperature data processing (threshold > 25°C = HIGH)
   - Status determination

## Prerequisites
- Docker and Docker Compose
- Node.js 20.x (for local development)
- Git

## Installation & Setup
1. **Clone the Repository**
   ```bash
   git clone https://github.com/rampa2510/temperature-monitor-challenge
   cd temperature-monitor
   ```

2. **Environment Setup**
   ```bash
   # Copy example environment file
   cp .env.example .env
   # Update .env with your configuration if needed
   ```

3. **Build and Start Services**
   ```bash
   # For Development
   docker compose -f docker-compose.dev.yml up --build

   # For Production
   docker compose up --build
   ```

4. **Verify Services**
   ```bash
   # Check if all services are running
   docker compose ps
   # Check service logs
   docker compose logs -f
   ```

## Available Services
After starting, the following services will be available:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- MongoDB: localhost:27017
- n8n Dashboard: http://localhost:5678

## WebSocket Events
### Server to Client Events
1. `temperature_reading`
   ```typescript
   {
     id: string
     temperature: number
     timestamp: string
   }
   ```
2. `processed_reading`
   ```typescript
   {
     id: string
     temperature: number
     timestamp: string
     status: 'NORMAL' | 'HIGH'
     processedAt: string
   }
   ```

## API Documentation
### Health Check
```
GET /health
Response: { 
  status: 'ok' | 'error',
  timestamp: string 
}
```

### Environment Variables
Key environment variables that need to be set in `.env`:
```env
# Ports
FRONTEND_PORT=3000
BACKEND_PORT=5000
MONGODB_PORT=27017
N8N_PORT=5678

# Hosts
MONGODB_HOST=mongodb
N8N_HOST=n8n

# Database
MONGODB_DB=temperature_db

# n8n
N8N_PROTOCOL=http
```

## Testing
The project includes:
- Unit tests for core logic
- Integration tests for API endpoints
- WebSocket connection testing
- Processing logic verification

### Running Tests with Docker Compose

To run the tests for your project, use the **docker-compose.test.yml** configuration. This will bring up the services required for testing (like the backend and MongoDB) without interfering with your development setup.

1. **Run Tests with docker-compose.test.yml**:
   ```bash
   docker-compose -f docker-compose.test.yml up --build
   ```

### Running Development Services with docker-compose.dev.yml

For local development and testing, use **docker-compose.dev.yml**. This configuration is optimized for development, including volume mounts for live code updates and other development-related settings.

```bash
docker-compose -f docker-compose.dev.yml up --build
```

## Monitoring
- Docker health checks are configured for all services
- Check container health: `docker ps`
- View logs: `docker compose logs -f [service-name]`

## Troubleshooting
1. **Services Not Starting**
   - Check logs: `docker compose logs [service-name]`
   - Verify ports are not in use
   - Ensure all required environment variables are set

2. **Database Connection Issues**
   - Verify MongoDB is running: `docker compose ps mongodb`
   - Check MongoDB logs: `docker compose logs mongodb`
   - Ensure connection string is correct in .env

3. **n8n Workflow Issues**
   - Access n8n dashboard at http://localhost:5678
   - Check n8n logs: `docker compose logs n8n`

## n8n Workflow Setup
1. **Import the Workflow**: After starting the n8n service, open the **n8n Dashboard** at [http://localhost:5678](http://localhost:5678). 
   - Go to the "Workflows" tab.
   - Click on the "Import" button and select the `temperature-processing-workflow.json` file located in the `/n8n-workflow` directory.
  
2. **Workflow Details**:
   - The workflow listens to the `temperature-process` webhook and processes the temperature readings.
   - If the temperature exceeds 25°C, the status is marked as `HIGH`, otherwise, it’s marked as `NORMAL`.

3. **Access n8n Logs**: If you encounter any issues, you can view the logs for n8n with:
   ```bash
   docker-compose logs -f n8n
   ```

## Success Metrics
- Real-time data flow with 2-second update intervals
- Accurate temperature processing (threshold > 25°C)
- Responsive UI updates with status badges
- Data persistence in MongoDB
- Comprehensive error handling
