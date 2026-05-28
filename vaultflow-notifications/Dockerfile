FROM maven:3.9-eclipse-temurin-23-alpine AS build
WORKDIR /workspace
COPY pom.xml .
COPY vaultflow-notifications/pom.xml vaultflow-notifications/pom.xml
COPY vaultflow-notifications/src   vaultflow-notifications/src
RUN mvn -f vaultflow-notifications/pom.xml clean package -DskipTests -q

FROM eclipse-temurin:23-jre-alpine
WORKDIR /app
COPY --from=build /workspace/vaultflow-notifications/target/*.jar app.jar
EXPOSE 8083
ENTRYPOINT ["java", "-jar", "app.jar"]
