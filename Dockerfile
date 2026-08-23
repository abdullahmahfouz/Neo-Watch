# Multi-stage build: compile with Maven + full JDK, run on a slim JRE.
# Build (from repo root): docker build -t neowatch-backend .
# Run:                    docker run -p 8080:8080 --env-file .env neowatch-backend

# ---- Build stage ----
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /app

# Cache dependencies in their own layer — only re-downloads when pom.xml changes,
# not on every source edit.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw -q dependency:go-offline

COPY src/ src/
RUN ./mvnw -q package -DskipTests

# ---- Runtime stage ----
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Runs as a non-root user inside the container (standard hardening; unrelated to
# any AWS-side identity/permissions).
RUN useradd --system --create-home appuser
USER appuser

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
