# Web3 Simple Indexer

### Setup

1. Build API file called `.api.json`

```json
{
    "mainnet": "https://mainnet.infura.io/v3/APIKEY",
    "sepolia": "https://sepolia.infura.io/v3/APIKEY"    
}
```

2. Create target address in file `target.json`

```json
{
  "network": "mainnet",
  "address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  "deploy_block": 21570176,
  "abi": [.......]
}
```

3. Set Function Names????