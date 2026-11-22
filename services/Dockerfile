# Image générique de scaffold pour les microservices Djassa.
# Chaque service reçoit son identité via ARG SERVICE et n'expose qu'un healthcheck
# tant que son application métier n'est pas implémentée.
FROM php:8.4.27-cli-alpine
ARG SERVICE=generic
ENV DJASSA_SERVICE=${SERVICE}
WORKDIR /app
COPY health.php /app/public/index.php
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app
EXPOSE 8080
CMD ["php", "-S", "0.0.0.0:8080", "-t", "/app/public"]
