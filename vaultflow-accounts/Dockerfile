FROM maven:3.9-eclipse-temurin-23-alpine AS build
WORKDIR /workspace
COPY pom.xml .
COPY vaultflow-accounts/pom.xml vaultflow-accounts/pom.xml
COPY vaultflow-accounts/src   vaultflow-accounts/src
RUN mvn -f vaultflow-accounts/pom.xml clean package -DskipTests -q

FROM eclipse-temurin:23-jre-alpine
WORKDIR /app
COPY --from=build /workspace/vaultflow-accounts/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
