# Base Dockerfile for Spring Boot services
FROM openjdk:21-jdk-slim

# Set working directory
WORKDIR /app

# Copy the JAR file
COPY target/*.jar app.jar

# Expose port (will be overridden by individual services)
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"] 