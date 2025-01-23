// SpaceDAO Indexer
// Author: Robert Cowlishaw (0x365)
// Info: 
// - Get all previous events from smart contract
// - Listen for new events from smart contract
// - Add all events to database
// WIP:
// - Add multi network at the same time compatability

require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise'); // Use mysql2 for MariaDB


// Load JSON utility
const loadJson = (fileName) => {
    return JSON.parse(fs.readFileSync(fileName, 'utf-8'));
};

function getFilesInFolder(folderPath) {
    try {
        const files = fs.readdirSync(folderPath); // Read the contents of the folder
        return files.map(file => path.join(folderPath, file)); // Return full paths
    } catch (err) {
        console.error(`Error reading folder: ${err.message}`);
        return [];
    }
}

// Database Initialization
async function createDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        console.log('Connected to the MariaDB database.');

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS logs (
                tx_hash VARCHAR(66),
                block_num INT,
                contract_address VARCHAR(42),
                event_name VARCHAR(255),
                args JSON,
                PRIMARY KEY (tx_hash)
            )
        `);

        return connection;
    } catch (err) {
        console.error('Error connecting to the database:', err);
        throw err;
    }
}

// Insert Logs into Database
async function insertLogs(connection, logs, eventName, contractAddress) {
    try {
        const query = `
            INSERT INTO logs (tx_hash, block_num, contract_address, event_name, args)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE args = VALUES(args)
        `;
        for (const log of logs) {
            const argsJson = JSON.stringify(
                log.args.map((arg) => (typeof arg === 'bigint' ? Number(arg) : arg))
            );
            await connection.execute(query, [
                log.transactionHash,
                log.blockNumber,
                contractAddress,
                eventName,
                argsJson,
            ]);
        }
    } catch (err) {
        console.error('Error inserting logs:', err);
    }
}

// Get Latest Block Number
async function getBlockStarter(connection, contractAddress) {
    try {
        // Get the maximum block_num from the logs table
        const [rows] = await connection.execute(
            'SELECT MAX(block_num) AS block_num FROM logs WHERE contract_address = ?;',
            [contractAddress] // Pass the specific contractAddress value here
        );
        // If rows exist, return the block_num, otherwise return null
        return rows.length ? rows[0].block_num : null;
    } catch (err) {
        console.error('Error fetching the latest block number:', err);
        throw err;
    }
}

// Fetch Logs in Chunks
async function fetchLogsInChunks(connection, fromBlock, toBlock, contract, eventName, contractAddress, retryLimit = 50) {
    let currentBlock = fromBlock;
    let chunkSize = toBlock - fromBlock + 1;
    // let chunkSize = Math.min(10000, toBlock - fromBlock + 1);
    while (currentBlock <= toBlock) {
        const endBlock = Math.min(currentBlock + chunkSize - 1, toBlock);
        try {
            
            const results = await contract.queryFilter(
                contract.filters[eventName](),
                currentBlock,
                endBlock
            );
            if (results.length > 0) {
                console.log("Previous", eventName ,"events added:", results.length)
                await insertLogs(connection, results, eventName, contractAddress);
            }
            currentBlock = endBlock + 1;
        } catch (error) {
            console.error(`Error fetching logs between ${currentBlock} and ${endBlock}: ${error.message}`);
            if (--retryLimit <= 0) {
                console.error('Reached retry limit. Exiting.');
                break;
            }
            chunkSize = Math.max(1, Math.floor(chunkSize / 2)); // Reduce chunk size on error
        }
    }
    console.log("Caught up with previous events for", eventName)
}

// Listen to Events
async function listenToEvents(contract, eventName, connection, contractAddress) {
    const eventFilter = contract.filters[eventName]();

    contract.on(eventFilter, async (log) => {
        try {
            await insertLogs(connection, [log.log], eventName, contractAddress);
        } catch (err) {
            console.error('Error inserting log:', err);
        }
    });
    console.log(`Successfully connected and listening for ${eventName} events.`);
}

// Main Execution
(async () => {
    try {
        const connection = await createDatabase();

        const targets_all = getFilesInFolder("./targets")
        console.log(targets_all)
        
        const contractNetworkName = "SEPOLIA"
        const infuraHttpUrl = process.env[`INFURA_${contractNetworkName.toUpperCase()}`];
        const providerHttp = new ethers.JsonRpcProvider(infuraHttpUrl);

        const latestBlockNumber = await providerHttp.getBlockNumber();

        if (!infuraHttpUrl) {
            throw new Error(`Missing Infura URL(s) for network ${contractNetworkName} in .env file.`);
        }

        for (let targetFileName of targets_all) {
            const target = loadJson(targetFileName);
            const { network: contractNetworkName, address: contractAddress, abi: contractAbi, deploy_block, contract_events: contractEvents } = target;

            const contract = new ethers.Contract(contractAddress, contractAbi, providerHttp);
            
            let fromBlock = await getBlockStarter(connection, contractAddress);
            if (fromBlock === null) {
                fromBlock = deploy_block;
            }

            // Fetch logs and listen to events
            for (const eventName of contractEvents) {
                fetchLogsInChunks(connection, fromBlock, latestBlockNumber, contract, eventName, contractAddress);
                listenToEvents(contract, eventName, connection, contractAddress);
            }
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
})();
