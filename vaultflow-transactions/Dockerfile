FROM maven:3.9-eclipse-temurin-23-alpine AS build
WORKDIR /workspace
COPY pom.xml .
COPY vaultflow-transactions/pom.xml vaultflow-transactions/pom.xml
COPY vaultflow-transactions/src   vaultflow-transactions/src
RUN mvn -f vaultflow-transactions/pom.xml clean package -DskipTests -q

FROM eclipse-temurin:23-jre-alpine
WORKDIR /app
COPY --from=build /workspace/vaultflow-transactions/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
