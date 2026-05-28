FROM maven:3.9-eclipse-temurin-23-alpine AS build
WORKDIR /workspace
COPY pom.xml .
COPY vaultflow-fraud/pom.xml vaultflow-fraud/pom.xml
COPY vaultflow-fraud/src   vaultflow-fraud/src
RUN mvn -f vaultflow-fraud/pom.xml clean package -DskipTests -q

FROM eclipse-temurin:23-jre-alpine
WORKDIR /app
COPY --from=build /workspace/vaultflow-fraud/target/*.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java", "-jar", "app.jar"]
