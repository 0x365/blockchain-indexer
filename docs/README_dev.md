# Dev Info

- Feel free to change any of the docker-compose exposed ports, I just set them randomly
- This is a work in progress, there are still issues

## TODO

1. Make indexer work for multiple `target.json` files and therefore for multiple smart contracts
2. Make target setting easier for all scripts in a single point

## Contribute

Contributions are welcome on this open-source project.

1. Fork the Project

2. Create your Feature Branch

```sh
git checkout -b feature/NewFeature
```

3. Commit your Changes

```sh
git commit -m 'Added some NewContent'
```

4. Push to the Branch

```sh
git push origin feature/NewFeature
```

5. Open a Merge Request

## Usage

### Prerequisites

- Docker Compose `sudo apt install docker-compose`
- You will require a blockchain node api service. I recommend [Infura](https://www.infura.io/)
- Currently designed for ubuntu (however it might work on windows)

### Setup target contract and events

1. Create `.env` file. The database details do not neccessarily need changed however you need to add the blockchain node api urls. Copy the example `.env` file with:
```bash
cp .env-example .env
```

2. Adapt `target.json` based on the contract details, deployed network and event names that you desire to index. An example is given below and with the full abi in `target.json`. More examples are given in `/example_targets/`. `/example_targets/target_big.json` is a contract that has a large amount of calls per second on the mainnet, and `/example_targets/target_small.json` is has a single event call.

```json
{
  "network": "sepolia",
  "address": "0xFF1aae6928D49c3744a81F891621e848914898ed",
  "deploy_block": 7354710,
  "contract_events": ["ContractCreated"],
  "abi": [...]
}
```

### Install npm packages

This will install all required npm packages in `/node_modules/`. The versions of the packages can be seen in `package.json`

```bash
npm install
```

### Start Indexer

Running `up` will start indexer, while running `down` will make sure it is fully stopped.

```bash
sudo docker-compose up
sudo docker-compose down
```

### Reset Indexer

Make sure the `sudo docker-compose down` has been run to fully stop the indexer. Running `ls` will show the VOLUME_NAME for the the `rm` command to remove all contents of the database.

```bash
sudo docker volume ls
sudo docker volume rm VOLUME_NAME
```


### Run individual objects

```bash
sudo docker-compose up -d mariadb web3
sudo docker-compose stop web2
sudo docker-compose restart web2
```

### Delete all docker data

WARNING - This may delete other docker containers, be very careful running this code.

```bash
sudo docker rm -f $(sudo docker ps -aq)
sudo docker rmi -f $(sudo docker images -q)
sudo docker volume rm $(sudo docker volume ls -q)
```