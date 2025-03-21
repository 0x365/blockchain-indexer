// Indexer
// Author: Robert Cowlishaw (0x365)
// Info: 
// - Get all previous events from smart contract
// - Listen for new events from smart contract
// - Add all events to database

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

function getEventVariableMap(abi) {
    const eventMap = {};
    abi.forEach(item => {
        if (item.type === "event") {
            eventMap[item.name] = item.inputs.map(input => input.name);
        }
    });
    return eventMap;
}

const convertBigIntToNumber = (value) => {
    return (typeof value === 'bigint') ? Number(value) : value;
};


// Database Initialization
async function createDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
        });

        console.log('Connected to the MariaDB database.');

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS events (
                event_id INT AUTO_INCREMENT,
                contract_address VARCHAR(42),
                event_name VARCHAR(255),
                contract_name VARCHAR(255),
                network_name VARCHAR(255),
                PRIMARY KEY (event_id),
                UNIQUE (contract_address, event_name)
            );
        `);

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS event_calls (
                tx_hash VARCHAR(66),
                event_id INT,
                block_number INT,
                PRIMARY KEY (tx_hash),
                FOREIGN KEY (event_id) REFERENCES events(event_id)
            );
        `);

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS event_call_args (
                tx_hash VARCHAR(66),
                arg_name VARCHAR(255),
                arg_value VARCHAR(255),
                PRIMARY KEY (tx_hash, arg_name),
                FOREIGN KEY (tx_hash) REFERENCES event_calls(tx_hash)
            );
        `);

        return connection;
    } catch (err) {
        console.error('Error connecting to the database:', err);
        throw err;
    }
}

async function getEventID(connection, target) { //contractAddress, eventName, contractName) {
    try {
        await connection.execute(`
            INSERT INTO events (contract_address, event_name, contract_name, network_name)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE contract_name = VALUES(contract_name)
            `, [target.contractAddress, target.eventName, target.nickname, target.networkName]
        );
        const [rows] = await connection.execute(`
            SELECT event_id FROM events
            WHERE contract_address = ? AND event_name = ? AND network_name = ?
            `, [target.contractAddress, target.eventName, target.networkName]
        );
        // If rows exist, return the block_num, otherwise return null
        return rows.length ? rows[0].event_id : null;
    } catch (err) {
        console.error("Error inserting event", err);
    }
}

// Insert Logs into Database
async function insertLogs(connection, logs, target) { //eventName, contractAddress, contractName, eventOutputs) {
    try {
        const eventID = await getEventID(connection, target);
        const query_per_event = `
            INSERT IGNORE INTO event_calls (tx_hash, event_id, block_number)
            VALUES (?, ?, ?)
        `;
        const query_per_arg = `
            INSERT IGNORE INTO event_call_args (tx_hash, arg_name, arg_value)
            VALUES (?, ?, ?)
        `;
        for (const log of logs) {
            await connection.execute(query_per_event, [
                log.transactionHash,
                eventID,
                log.blockNumber
            ]);
            target.eventOutputFormat.forEach((key, index) => {
                if (typeof log.args[index] === "string") {
                    connection.execute(query_per_arg, [
                        log.transactionHash,
                        key,
                        convertBigIntToNumber(log.args[index])
                    ]);
                }
            });
        }
    } catch (err) {
        console.error('Error inserting logs:', err);
    }
}

// Get Latest Block Number
async function getBlockStarter(connection, contractAddress, eventName, networkName) {
    try {
        // Get the maximum block_num from the logs table
        const [rows] = await connection.execute(`
            SELECT MAX(ec.block_number) AS block_num
            FROM event_calls ec
            JOIN events e ON ec.event_id = e.event_id
            WHERE e.contract_address = ?
            AND e.event_name = ?
            AND e.network_name = ?
            `, [contractAddress, eventName, networkName] // Pass the specific contractAddress value here
        );
        // If rows exist, return the block_num + 1, otherwise return null
        return rows[0].block_num ? (rows[0].block_num + 1) : null;
    } catch (err) {
        console.error('Error fetching the latest block number:', err);
        throw err;
    }
}

// Fetch Logs in Chunks
async function fetchLogsInChunks(connection, target, retryLimit = 50) {
    let currentBlock = target.startBlock;
    let chunkSize = target.endBlock - target.startBlock + 1;
    while (currentBlock <= target.endBlock) {
        const endBlock = Math.min(currentBlock + chunkSize - 1, target.endBlock);
        try {
            const results = await target.contract.queryFilter(
                target.contract.filters[target.eventName](),
                currentBlock,
                endBlock
            );
            if (results.length > 0) {
                console.log("Previous", target.eventName ,"events added:", results.length)
                await insertLogs(connection, results, target);
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
    console.log("Caught up with previous events for", target.eventName)
}


// Listen to Events
async function listenToEvents(connection, target) {
    const eventFilter = target.contract.filters[target.eventName]();
    target.contract.on(eventFilter, async (log) => {
        try {
            await insertLogs(connection, [log.log], target);
        } catch (err) {
            console.error('Error inserting log:', err);
        }
    });
    console.log(`Successfully connected and listening for ${target.eventName} events.`);
}



// Main Execution
(async () => {
    try {
        const connection = await createDatabase();
        const targets_all = getFilesInFolder("./targets")
        console.log(targets_all)
        
        for (let targetFileName of targets_all) {
            const target = loadJson(targetFileName);

            const contractNetworkName = target.network
            const infuraHttpUrl = `https://${contractNetworkName.toLowerCase()}.infura.io/v3/${process.env["INFURA_API_KEY"]}`
            
            const providerHttp = new ethers.JsonRpcProvider(infuraHttpUrl);
            const latestBlockNumber = await providerHttp.getBlockNumber();
            if (!infuraHttpUrl) {
                throw new Error(`Missing Infura URL(s) for network ${contractNetworkName} in .env file.`);
            }

            const contractObject = new ethers.Contract(target.address, target.abi, providerHttp);
            const eventMapper = getEventVariableMap(target.abi)
            // Fetch logs and listen to events
            for (const eventName of target.contract_events) {
                const target_package = {
                    startBlock: (await getBlockStarter(connection, target.address, eventName, contractNetworkName.toLowerCase())) || target.deploy_block,
                    endBlock: latestBlockNumber,
                    contract: contractObject,
                    eventName: eventName,
                    contractAddress: target.address,
                    nickname: targetFileName.substring(8, targetFileName.length-5),
                    eventOutputFormat: eventMapper[eventName],
                    networkName: contractNetworkName.toLowerCase(),
                }
                fetchLogsInChunks(connection, target_package);
                listenToEvents(connection, target_package);
            }
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
})();
