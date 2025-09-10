#!/bin/sh

if [ ! -f .env ]; then
	echo "Please fill in .env file and re-run setup"
	cp ./etc/.env-template .env
    return 1
fi

echo "Running sudo docker compose up"
sudo docker-compose up --build