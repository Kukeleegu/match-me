# Match Me

A full-stack dating/matching application built with Spring Boot and React.

## Features

- **User Authentication** - JWT-based login and registration
- **Profile Management** - Create and edit detailed user profiles with photos
- **Smart Matching** - Compatibility-based user matching algorithm
- **Like/Dislike System** - Swipe-style user interactions
- **Real-time Chat** - WebSocket-based messaging between matches
- **User Preferences** - Age, location, gender, and interest filtering
- **Profile Viewing** - Visit user profiles via direct URLs (`/users/{id}`)

## Tech Stack

### Backend
- **Spring Boot 3.5.0** - Java framework
- **PostgreSQL** - Database
- **Spring Security** - Authentication & authorization
- **JWT** - Token-based authentication
- **WebSocket** - Real-time messaging
- **JPA/Hibernate** - ORM

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool & dev server
- **React Router** - Client-side routing
- **CSS Modules** - Styling
- **WebSocket/STOMP** - Real-time messaging

## Prerequisites

- Java 21
- Node.js 18+
- PostgreSQL 12+
- Maven 3.6+

## Database Setup

1. Install PostgreSQL and create a database named `match_me`
2. Create a user with username `admin` and password `1234`
3. Grant privileges to the user for the database

See the included guides for detailed PostgreSQL installation:
- `postgres_install_guide.md` (Linux/Mac)
- `postgres_windows_install_guide.md` (Windows)

## Installation & Setup

### Backend Setup

1. Navigate to the project root directory
2. Configure database connection in `src/main/resources/application.properties` if needed
3. Build and run the Spring Boot application:

```bash
# Using Maven wrapper
./mvnw spring-boot:run

# Or using Maven directly
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Users
- `GET /api/users/{id}` - Get basic user info (name, profile link)
- `GET /api/users/{id}/profile` - Get user profile details
- `GET /api/users/{id}/bio` - Get user biographical data
- `GET /api/users/recommendations` - Get 10 recommended user IDs
- `GET /api/users/filtered` - Get filtered users based on preferences

### Likes & Matches
- `POST /api/likes/interact` - Like/dislike a user
- `GET /api/likes/matches` - Get user's matches
- `GET /api/likes/connections` - Get connected user IDs
- `GET /api/likes/enriched-matches` - Get detailed match information

### Chat
- `GET /api/chat/chat-id/{userId}` - Get chat ID with specific user
- WebSocket endpoint: `/ws` - Real-time messaging

## Project Structure

```
match-me/
├── src/main/java/com/example/match_me/
│   ├── controller/          # REST controllers
│   ├── service/            # Business logic
│   ├── repository/         # Data access layer
│   ├── entity/            # JPA entities
│   ├── DTO/               # Data transfer objects
│   ├── config/            # Configuration classes
│   └── security/          # Security components
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   └── services/      # Frontend services
│   └── public/           # Static assets
└── uploads/              # File upload directory
```


## Configuration

Key configuration options in `application.properties`:

- Database connection settings
- JWT secret and expiration
- File upload directory
- Hibernate DDL mode
