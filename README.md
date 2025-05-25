# WordMaster

![WordMaster Logo](frontend/wordmaster/public/LOGO.png)

WordMaster is an interactive language learning platform designed to enhance vocabulary, grammar, and communication skills through role-based gameplay and comprehensive progress tracking.

## Team Members

- [Craig Matthew Cartilla](https://github.com/pinkslipin)
- [Julio Miguel Dumaguing](https://github.com/Yongyong111)
- [Rae Addison P. Duque](https://github.com/Relay28)
- [Jeannei Maragarett G. Verar](https://github.com/Jeaej)

## Key Features

### User Authentication & Management
- Multiple login options: Email/password and Microsoft OAuth2
- Role-based access control (Teacher, Student, Admin)
- Comprehensive profile management and customization
- Administrative dashboard for user management

### Classroom Management
- Teacher-managed classrooms with unique enrollment codes
- Seamless student enrollment process
- Robust content creation system with word banks and role assignments
- AI-assisted content generation for teachers

### Interactive Learning System
- Dynamic game sessions with configurable parameters
- Role-based gameplay encouraging immersive language practice
- Word bank and "word bomb" mechanics for vocabulary enrichment
- Power-up card system to reward advanced language usage

### Progress Tracking & Assessment
- Real-time metrics tracking student performance
- Comprehensive teacher assessment interface with AI assistance
- In-depth analytics on grammar accuracy, vocabulary usage, and role performance
- Student progress review with historical performance data

## Technical Stack

### Frontend
- React with Material UI
- Vite for fast development and build
- Context-based state management
- WebSocket integration for real-time gameplay

### Backend
- Java Spring Boot RESTful API
- JWT authentication
- WebSocket support for real-time communication
- AI integration for content generation and assessment

### Database
- MySQL for persistent storage
- Efficient data models for game state and progress tracking

## Installation Guide

### Prerequisites
- Node.js (v16+)
- Java JDK 17+
- MySQL 8.0+
- Maven 3.8+

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend/wrdmstr

2. Configure database settings in src/main/resources/application.properties:
3. Build and run the Spring Boot application:
   ```bash
   mvn spring-boot:run

### Frontend Setup

1. Navigate to the Frontend Directory
   ```bash
   cd frontend/wordmaster
2. Install Dependencies
   ```bash
   npm install
3. Create a .env file with the following content
   ```env
   REACT_APP_API_URL=http://localhost:8080/api
4. Start the Development Serever
   ```bash
   npm run dev
