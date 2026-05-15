# ─── Build stage ─────────────────────────────
FROM eclipse-temurin:17-jdk-alpine AS build

WORKDIR /app

# 캐시 최적화: Gradle 설정만 먼저
COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle gradle.properties ./
RUN chmod +x gradlew
RUN ./gradlew dependencies --no-daemon || true

# 소스 복사 + 빌드
COPY src src
RUN ./gradlew bootJar --no-daemon

# ─── Runtime stage ───────────────────────────
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

# JVM fast-start 옵션
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseSerialGC -Xss512k -XX:TieredStopAtLevel=1"

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
