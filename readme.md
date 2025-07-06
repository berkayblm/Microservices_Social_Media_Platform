# Microservices Social Media Platform - Project Report

## Executive Summary

This project implements a comprehensive social media platform built using a microservices architecture. The system consists of 8 microservices that work together to provide a full-featured social networking experience, including user authentication, content management, messaging, file uploads, and real-time communication capabilities.

## Project Overview

### Architecture Pattern
- **Microservices Architecture**: The application is built using Spring Boot microservices with service discovery, API gateway, and distributed data management
- **Technology Stack**: Java 21, Spring Boot 3.3.3, Spring Cloud 2023.0.3, MySQL, Redis, Webpack, Bootstrap 5
- **Communication**: RESTful APIs with service-to-service communication via HTTP clients
- **Security**: JWT-based authentication with centralized authorization at the API Gateway

### Key Features
- User registration and authentication
- Social media posts with images and comments
- Real-time messaging system
- User profiles and following system
- File upload and management
- Responsive web interface
- Circuit breaker pattern for fault tolerance
- Rate limiting and security measures

## System Architecture
![alt text](https://drive.google.com/file/d/1YfMQ4G7BIXQsaYbecZR4kUDmcc0xitRE/view?usp=drive_link)

### 1. Service Discovery (Discovery Service)
- **Port**: 8761
- **Technology**: Netflix Eureka Server
- **Purpose**: Centralized service registry for all microservices
- **Features**: 
  - Automatic service registration and discovery
  - Health monitoring
  - Load balancing support

### 2. API Gateway
- **Port**: 8080
- **Technology**: Spring Cloud Gateway
- **Purpose**: Single entry point for all client requests
- **Key Features**:
  - **Authentication Filter**: JWT token validation for secured endpoints
  - **Rate Limiting**: Redis-based rate limiting with configurable thresholds
  - **Circuit Breaker**: Resilience4j integration for fault tolerance
  - **CORS Configuration**: Cross-origin resource sharing support
  - **Route Management**: Intelligent routing to appropriate microservices

#### Gateway Routes Configuration:
```yaml
- Authentication endpoints: /api/auth/* (public)
- User management: /api/users/* (authenticated)
- Profile management: /api/profiles/* (authenticated)
- Post management: /api/posts/* (authenticated)
- Followers: /api/follows/* (authenticated)
- Messaging: /api/messages/* (authenticated)
- File uploads: /api/upload/* (authenticated)
```

### 3. User Service
- **Port**: 8081
- **Database**: MySQL (micro_user_db)
- **Purpose**: User authentication and management
- **Features**:
  - User registration and login
  - JWT token generation and validation
  - Password encryption
  - User profile integration
  - Random user suggestions

#### User Entity:
```java
@Entity
@Table(name = "users")
public class User {
    private Long id;
    private String username; // unique
    private String email;    // unique
    private String password;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### 4. Post Service
- **Port**: 8082
- **Database**: MySQL (micro_post_db)
- **Purpose**: Content management and social interactions
- **Features**:
  - Create, read, update, delete posts
  - Image upload integration
  - Comments system
  - Like/unlike functionality
  - Pagination support
  - User validation integration

#### Post Entity:
```java
@Entity
@Table(name = "posts")
public class Post {
    private Long id;
    private String title;
    private String content;
    private String imageUrl;
    private Long userId;
    private List<Comment> comments;
    private List<Like> likes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### 5. Messaging Service
- **Port**: 8085
- **Database**: Redis
- **Purpose**: Real-time messaging and chat functionality
- **Features**:
  - In-memory message storage using Redis
  - Real-time message delivery
  - Message history
  - User-to-user communication

### 6. Followers Service
- **Port**: 8084
- **Database**: MongoDb
- **Purpose**: Social connections and user relationships
- **Features**:
  - Follow/unfollow users
  - Follower/following lists
  - User relationship management
  - Integration with user service

### 7. Profile Service
- **Port**: 8083
- **Database**: MySQL
- **Purpose**: User profile management
- **Features**:
  - Profile creation and updates
  - Avatar image upload
  - Profile information management
  - Integration with file upload service

### 8. File Upload Service
- **Port**: 8086
- **Purpose**: File storage and management
- **Features**:
  - Image upload and storage
  - File validation
  - Multiple file format support
  - Integration with other services

## Frontend Architecture

### Technology Stack
- **Framework**: Vanilla JavaScript with modular architecture
- **Build Tool**: Webpack 5 with development and production configurations
- **UI Framework**: Bootstrap 5.3.0
- **Icons**: Font Awesome 6.4.0
- **Styling**: Custom CSS with responsive design

### Key Pages
1. **Login Page** (`login.html`): User authentication interface
2. **Signup Page** (`signup.html`): User registration interface
3. **Feed Page** (`feed.html`): Main social media feed with posts
4. **Profile Page** (`profile.html`): User profile management
5. **Chat Page** (`chat.html`): Real-time messaging interface
6. **Post Details** (`post-details.html`): Individual post view with comments

### Frontend Features
- **Responsive Design**: Mobile-first approach with Bootstrap
- **Real-time Updates**: WebSocket integration for live messaging
- **Image Upload**: Drag-and-drop file upload functionality
- **Infinite Scroll**: Pagination for posts and comments
- **Search and Filter**: User search and content filtering
- **Notifications**: Real-time notification system

## Security Implementation

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication using JSON Web Tokens
- **Token Validation**: Centralized validation at API Gateway
- **Password Security**: Encrypted password storage
- **Route Protection**: Selective endpoint protection based on requirements

### Security Features
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Rate Limiting**: Redis-based rate limiting to prevent abuse
- **Input Validation**: Comprehensive input sanitization
- **Error Handling**: Secure error responses without information leakage

## Data Management

### Database Strategy
- **Polyglot Persistence**: Different databases for different use cases
- **MySQL**: Primary database for user data, posts, and relationships
- **Redis**: In-memory database for messaging and caching
- **Data Consistency**: Eventual consistency with service-to-service communication

### Data Models
- **User Management**: Centralized user data with profile integration
- **Content Management**: Posts with comments, likes, and media
- **Social Graph**: Follower/following relationships
- **Messaging**: Real-time message storage and delivery

## Performance & Scalability

### Performance Optimizations
- **Circuit Breaker Pattern**: Resilience4j implementation for fault tolerance
- **Caching**: Redis-based caching for frequently accessed data
- **Load Balancing**: Client-side load balancing via Eureka
- **Connection Pooling**: Database connection optimization

### Scalability Features
- **Horizontal Scaling**: Independent service scaling
- **Service Discovery**: Dynamic service registration and discovery
- **Stateless Design**: JWT-based stateless authentication
- **Microservices**: Independent deployment and scaling

## Development & Deployment

### Development Environment
- **Java 21**: Latest LTS version for backend services
- **Maven**: Dependency management and build tool
- **Webpack**: Frontend bundling and development server
- **Docker Ready**: Containerization support (implied by microservices architecture)

### Build Configuration
```json
{
  "scripts": {
    "start": "webpack serve --open --config webpack.config.dev.js",
    "build": "webpack --config webpack.config.prod.js"
  }
}
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/current-user` - Get current user info

### User Management
- `GET /api/users` - Get user list
- `GET /api/users/{id}` - Get specific user
- `POST /api/users/validateToken` - Validate JWT token

### Content Management
- `GET /api/posts` - Get posts with pagination
- `POST /api/posts` - Create new post
- `PUT /api/posts/{id}` - Update post
- `DELETE /api/posts/{id}` - Delete post
- `POST /api/posts/{id}/comments` - Add comment
- `POST /api/posts/{id}/likes` - Like/unlike post

### Social Features
- `POST /api/follows/{userId}` - Follow user
- `DELETE /api/follows/{userId}` - Unfollow user
- `GET /api/follows/followers` - Get followers
- `GET /api/follows/following` - Get following

### Messaging
- `GET /api/messages` - Get messages
- `POST /api/messages` - Send message

### File Management
- `POST /api/upload` - Upload file
- `GET /api/upload/{filename}` - Get file


## Conclusion

This microservices social media platform demonstrates a modern, scalable architecture that can handle real-world social networking requirements. The separation of concerns, fault tolerance mechanisms, and comprehensive security implementation make it suitable for production deployment. The modular design allows for independent scaling and maintenance of different system components, while the frontend provides a responsive and user-friendly interface.

The project successfully implements key microservices patterns including service discovery, API gateway, circuit breakers, and distributed data management. The technology choices are current and well-suited for the application's requirements, providing a solid foundation for future enhancements and scaling. 
