# Real-Time Temperature Monitoring System

A modern real-time temperature monitoring system built with React (Remix), Node.js, MongoDB, and n8n workflow automation.

## ⚠️  Important Production Notice
There is currently a known issue with environment variables not being properly loaded in the production build due to complexities between Remix, Docker, and environment variable handling during the build process. Please use the development configuration for both development and production environments until this is resolved.

## System Architecture

### 1. Frontend (Remix)
- Large central temperature display
- Real-time connection status indicator
- Timestamp of last update
- Last 5 readings display with:
  - Temperature value
  - Status badge (NORMAL/HIGH)
  - Relative timestamp
  - Current connection state
- Temperature range: 15-30°C
- Responsive UI updates

### 2. Backend (Node.js + TypeScript)
- Temperature data generation (every 2 seconds)
- WebSocket connections management
- Data processing and storage
- REST API endpoints
- Error handling and logging

### 3. MongoDB
- Persistent storage for temperature readings
- Historical data storage
- Efficient querying support
- Reading history tracking
- Processing status tracking

### 4. n8n
- Workflow automation
- Temperature data processing (threshold > 25°C = HIGH)
- Status determination
- Webhook-based integration

## Prerequisites
- Docker and Docker Compose
- Node.js 20.x (for local development)
- Git

## Core Technologies
- Frontend: React 18+
- Backend: Node.js 18+
- Database: MongoDB
- Processing: n8n (preferred) or Node.js
- Container: Docker

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

3. **Import n8n workflow**
   - Access n8n dashboard at http://localhost:5678
   - Import workflow from `/n8n-workflow/Assignment.json

4. **Build and Start Services**
   ```bash
   # For Development
   docker compose -f docker-compose.dev.yml up --build

   # For Production (please dont use for now)
   docker compose up --build
   ```

5. **Verify Services**
   ```bash
   # Check if all services are running
   docker compose ps
   # Check service logs
   docker compose logs -f
   ```

## Communication Protocols

### REST API Endpoints

#### Health Check
```
GET /api/health
Response: { 
  status: 'ok' | 'error',
  timestamp: string 
}
```

#### Process Reading
```
POST /api/readings/process
Request: {
  id: string
  temperature: number
  timestamp: string
}
Response: {
  success: boolean
  reading: {
    id: string
    status: 'NORMAL' | 'HIGH'
    processedAt: string
  }
}
```

### WebSocket Events

#### Server to Client Events

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

## Processing Implementation

### n8n Workflow (Preferred)
1. **Setup Instructions**
   - Access n8n dashboard at http://localhost:5678
   - Import workflow from `/n8n-workflow/Assignment.json
   - Configure webhook trigger
   - Verify temperature threshold processing (> 25°C = HIGH)

### Alternative Node.js Processing
- Implements processing service in backend
- Maintains same data flow structure
- Applies identical processing logic
- Ensures consistent response format

## Environment Variables
Key environment variables for `.env`:
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

## Service Dependencies
- Backend → MongoDB
- Backend → Processing Service (n8n or Node.js)
- Frontend → Backend (WebSocket)

## Testing

### Test Categories
- Unit tests for core logic
- Integration tests for API endpoints
- WebSocket connection testing
- Processing logic verification

### Running Tests

1. **With Docker Compose**:
   ```bash
   docker-compose -f docker-compose.test.yml up --build
   ```

2. **Development Environment**:
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

## API Documentation
Complete API documentation is available at `/api/documentation` using Swagger UI.

## Monitoring and Troubleshooting

### Health Monitoring
- Docker health checks configured for all services
- Check container health: `docker ps`
- View logs: `docker compose logs -f [service-name]`

### Common Issues and Solutions

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

## Success Metrics

### Core Requirements
- Real-time data flow with 2-second update intervals
- Accurate temperature processing (threshold > 25°C)
- Responsive UI updates with status badges
- Data persistence in MongoDB
- Comprehensive error handling

### Excellence Indicators
- n8n workflow implementation
- Clean architecture
- Comprehensive testing
- Clear documentation
- Professional code quality
