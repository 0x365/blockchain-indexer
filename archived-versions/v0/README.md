# Blockchain Indexer
Blockchain Indexer or Data Cacher for a specific Smart Contract

This is for a generic smart contract, where all transactions are recorded and placed in a database ready to be used for by a web api.

## DEV DETAILS

- Currently being developed on Ubuntu v24.04
- Dev version must be used at the moment

#### Indexer details
- If turned off and on again, it will just fill database with repeat data
- If archive returns more than 1000, error occurs 
- Currently only handles 1 event at a time
- Archiver shows count higher than what actually gets submitted

## Run with Docker

Tested and developed with docker compose (Tested with Docker Engine v26.1.1, Docker Compose v2.27.0).

1. Set `.env` file. All and any of this can be changed. An API key is required for the URLs.
```yml
URL_WEBSOCKET="wss://mainnet.infura.io/ws/v3/{API-KEY}"
URL_HTTP="https://mainnet.infura.io/v3/{API-KEY}"
DATABASE_HOST="localhost"
DATABASE_USER="user"
DATABASE_PASSWORD="password"
DATABASE_DATABASE="mydatabase"
DATABASE_ROOT_PASSWORD="password2"
```

2. Set `target.js` to the desired contract, abi, and start block. An example version is given which is setup to index the USDT smart contract on Ethereum Mainnet. By running the python script `tools/fetch_abi.py` there is a high chance the abi of deployed contracts on the mainnet will be returned (however this is not guaranteed). This can be done as follows and will create a file called `abi.json`:
```bash
python3.10 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python fetch_abi.py <Deployed Contract Address>
```

3. Deploy full system
```bash
sudo docker compose up
# Or run with hidden log
sudo docker compose up -d
```
or run command script
```bash
sudo bash indexer.sh [OPTIONS]
```
```
Options:
  -h,     --help                 Display usage
  -db,    --run-db               Start database and database manager containers
  -indx,  --run-indexer          Start indexer container
  -xdb,   --shutdown-db          Shutdown database and database manager containers
  -xind,  --shutdown-indexer     Shutdown indexer container
  -x,     --shutdown-all         Shutdown all containers
  -c,     --clean                Delete containers (Somewhat dangerous)
```

## Dev

#### Ports
- Databse UI - Adminer is currently running on `localhost:8080`
- Database - Mariadb is currently running on `localhost:3306`

#### Run `indexer.js` without docker.
```bash
node indexer.js
```
Problems often occur here if you don't have the correct version of node. Try `nvm use 20.13.1`

#### Stop containers and remove containers
```bash
# Stop all containers
sudo docker stop $(docker ps -a -q)
# Delete all containers
sudo docker rm $(docker ps -a -q)
```

## Dev details for working version

- Tested and developed with docker compose (Tested with Docker Engine v26.1.1, Docker Compose v2.27.0).
- Node.js (Tested with nvm v0.39.1, node.js v20.13.1, npm 10.5.2)
- Specific version details given below:
```
  blockchain-indexer: '0.1.0',
  npm: '10.5.2',
  node: '20.13.1',
  acorn: '8.11.3',
  ada: '2.7.8',
  ares: '1.28.1',
  base64: '0.5.2',
  brotli: '1.1.0',
  cjs_module_lexer: '1.2.2',
  cldr: '45.0',
  icu: '75.1',
  llhttp: '8.1.2',
  modules: '115',
  napi: '9',
  nghttp2: '1.61.0',
  nghttp3: '0.7.0',
  ngtcp2: '1.1.0',
  openssl: '3.0.13+quic',
  simdutf: '5.2.4',
  tz: '2024a',
  undici: '6.13.0',
  unicode: '15.1',
  uv: '1.46.0',
  uvwasi: '0.0.20',
  v8: '11.3.244.8-node.20',
  zlib: '1.3.0.1-motley-7d77fb7'
```
