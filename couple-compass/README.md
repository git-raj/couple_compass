# Couple Compass

A comprehensive relationship-focused application that helps couples strengthen their bond through personalized insights, mood tracking, and AI-powered recommendations.

## Architecture Overview

Couple Compass follows a microservices architecture with:

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, Apollo Client
- **BFF Layer**: NestJS with GraphQL, Redis caching, WebSocket support  
- **Backend**: FastAPI with Python, SQLAlchemy, PostgreSQL
- **Infrastructure**: Kubernetes deployment with auto-scaling, monitoring
- **AI Integration**: OpenAI GPT-4 for insights, Whisper for voice transcription

## Core Features

- User authentication & partner linking system
- Gamified quizzes (love language, communication style)
- Daily mood check-ins with analytics
- Private/shared journaling with voice notes
- AI-powered personalized tips
- Real-time dashboard with streak tracking
- Optional menstrual cycle tracking

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+

### Local Development

1. Clone the repository
2. Set up environment variables (see `.env.example` files)
3. Start the development environment:
   ```bash
   docker-compose -f infrastructure/docker-compose.dev.yml up
   ```

### Project Structure

```
couple-compass/
├── backend/          # FastAPI backend service
├── bff/             # NestJS GraphQL BFF layer
├── frontend/        # Next.js web application
├── infrastructure/  # Docker, Kubernetes, CI/CD configs
└── docs/           # Project documentation
```

## Development Workflow

1. **Phase 1**: Foundation & Core Infrastructure
2. **Phase 2**: Backend Services  
3. **Phase 3**: Frontend Application
4. **Phase 4**: AI & Advanced Features
5. **Phase 5**: Deployment & Production

## Contributing

Please read our contributing guidelines and code of conduct before submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
