# Blockchain Indexer

## About

This indexer listens for all events executed on a specific smart contract and puts them in a MySQL Database. It is meant to be easy to use. This is then meant to be used for quick interaction with smart contracts for web applications rather than the slower blockchain. All details in the database can be checked against the blockchain at any point to ensure security.

Displays on `localhost:3013/docs`

## Setup

#### Prerequisites

- Currently designed for ubuntu (however it might work on windows).

- You will require a blockchain node api service. Currently it is setup for [Infura](https://www.infura.io/).

- Installing docker. This is always a joy. Further docker installation help can be found [here](./etc/docker_installation).

#### Startup

1. Place target smart contracts in `./index/targets/` as a `.json` file. A template already exists of a working smart contract. The template below resembles the format:
```json
{
  "network": "sepolia",
  "address": "0xFF1aae6928D49c3744a81F891621e848914898ed",
  "deploy_block": 7354710,
  "contract_events": ["ContractCreated"],
  "abi": [...]
}
```

2. Run the setup command. This will initially create a `.env` file where your unique Infura API key can be inputted. Running the command after creating `.env` file will start docker file.
```bash
. ./setup.sh
```

3. Once up and running (may take about a minute to launch with an additional 10 minutes to gather all historical data about smart contract) open `localhost:3013/docs` in your browser to see queries that are possible.

## Other useful commands

#### Starting and stopping containers

Running `up` will start the system. Running `down` will stop the system.
```bash
sudo docker compose up
sudo docker compose down
sudo docker compose restart
```

Adding one or more of the following to the end can customise these. The order of addition should be as given below:
- `--build` rebuilds the container after any changes have been made.
- `-d` on end will start the container in quite mode.
- `db`, `index`, `api` will only start that container.

#### Remove data in database

Make sure the sudo docker-compose down has been run to fully stop the indexer. Running ls will show the VOLUME_NAME for the the rm command to remove all contents of the database.

```bash
sudo docker volume ls
sudo docker volume rm VOLUME_NAME
```

#### Delete all docker data

WARNING - This may delete other docker containers, be very careful running this code.

```bash
sudo docker rm -f $(sudo docker ps -aq)
sudo docker rmi -f $(sudo docker images -q)
sudo docker volume rm $(sudo docker volume ls -q)
```