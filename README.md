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
  "network": "sepolia",
  "address": "0xFF1aae6928D49c3744a81F891621e848914898ed",
  "deploy_block": 7354710,
  "contract_events": ["ContractCreated"],
  "abi": [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "creator",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "ContractCreated",
      "type": "event"
    }
  ]
}
```

3. Set Function Names????