# Couple Compass - Dockerized

This project is containerized using Docker and orchestrated with Docker Compose.

## Prerequisites

- Docker Desktop installed and running

## Getting Started

1.  Clone the repository:

    ```bash
    git clone <repository_url>
    cd couple-compass
    ```

2.  Create a `.env` file in the `couple-compass` directory by copying the contents of `.env.example` and filling in the required environment variables:

    ```bash
    cp .env.example .env
    # Edit .env and fill in the values
    nano .env
    ```

3.  Run the application using Docker Compose:

    ```bash
    docker-compose up
    ```

    This command will build the images and start the containers for the backend, frontend, and Redis.

4.  Access the application in your browser at `http://localhost:3000`.

## Development

For development, you can use the `docker-compose.dev.yml` file. This file mounts the source code into the containers, allowing you to make changes and see them reflected in the running application without rebuilding the images.

```bash
docker-compose -f docker-compose.dev.yml up
```

## Notes

-   The backend is exposed on port 8000.
-   The frontend is exposed on port 3000.
-   Redis is used for caching and session management.

## Contributing

Feel free to contribute to this project by submitting pull requests.
