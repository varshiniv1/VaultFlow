FROM maven:3.9-eclipse-temurin-23-alpine AS build
WORKDIR /workspace
COPY pom.xml .
COPY vaultflow-gateway/pom.xml vaultflow-gateway/pom.xml
COPY vaultflow-gateway/src   vaultflow-gateway/src
RUN mvn -f vaultflow-gateway/pom.xml clean package -DskipTests -q

FROM eclipse-temurin:23-jre-alpine
WORKDIR /app
COPY --from=build /workspace/vaultflow-gateway/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
