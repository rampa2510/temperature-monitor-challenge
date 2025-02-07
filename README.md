# Real-Time Temperature Monitoring System

A modern real-time temperature monitoring system built with React (Remix), Node.js, MongoDB, Redis, and n8n workflow automation.

## System Architecture

The system consists of five main components:

1. **Frontend (Remix)**
   - Real-time temperature display
   - Connection status indicator
   - Last 5 readings with timestamps
   - Status badges (NORMAL/HIGH)

2. **Backend (Node.js + TypeScript)**
   - Temperature data generation
   - WebSocket connections
   - Data processing and storage
   - API endpoints

3. **MongoDB**
   - Persistent storage for temperature readings
   - Historical data storage

4. **Redis**
   - Real-time data caching
   - Pub/Sub for real-time updates

5. **n8n**
   - Workflow automation
   - Temperature data processing
   - Status determination

## Prerequisites

- Docker and Docker Compose
- Node.js 20.x (for local development)
- Git

## Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
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
   # Build all services
   docker-compose build

   # Start all services
   docker-compose up -d
   ```

4. **Verify Services**
   ```bash
   # Check if all services are running
   docker-compose ps

   # Check service logs
   docker-compose logs -f
   ```

## Available Services

After starting, the following services will be available:

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- MongoDB: localhost:27017
- Redis: localhost:6379
- n8n Dashboard: http://localhost:5678

## Development

### Running Services Individually

**Frontend (Remix)**
```bash
cd frontend
npm install
npm run dev
```

**Backend**
```bash
cd backend
npm install
npm run dev
```

### Environment Variables

Key environment variables that need to be set in `.env`:

```env
# Ports
FRONTEND_PORT=3000
BACKEND_PORT=4000
MONGODB_PORT=27017
REDIS_PORT=6379
N8N_PORT=5678

# Hosts
MONGODB_HOST=mongodb
REDIS_HOST=redis
N8N_HOST=n8n

# Database
MONGODB_DB=temperature_db

# n8n
N8N_PROTOCOL=http
```

## API Documentation

### Health Check
```
GET /health
Response: { "status": "ok" }
```

### Temperature Data
```
GET /api/temperature/latest
Response: { "temperature": number, "timestamp": string, "status": string }
```

## Monitoring

- Docker health checks are configured for all services
- Check container health: `docker ps`
- View logs: `docker-compose logs -f [service-name]`

## Troubleshooting

1. **Services Not Starting**
   - Check logs: `docker-compose logs [service-name]`
   - Verify ports are not in use
   - Ensure all required environment variables are set

2. **Database Connection Issues**
   - Verify MongoDB is running: `docker-compose ps mongodb`
   - Check MongoDB logs: `docker-compose logs mongodb`
   - Ensure connection string is correct in .env

3. **n8n Workflow Issues**
   - Access n8n dashboard at http://localhost:5678
   - Check n8n logs: `docker-compose logs n8n`

## License

[Your License Here]

## Contributing

[Your Contributing Guidelines Here]
