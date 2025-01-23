// SpaceDAO Database API
// Author: Robert Cowlishaw (0x365)
// Info: 
// - Expose each event in database on seperate endpoint
// - Expose all events in database on /events/all endpoint
// - Expose help page on /help endpoint
// - Redirect all random API endpoint inputs to help page

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise'); // Use mysql2 for MariaDB
const generateHelpPage = require('./html/helpPage'); // Import the help page function

const app = express();
app.use(cors()); // Enable CORS for your Vue frontend

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

const targets_all = getFilesInFolder("./targets")

const { addressEventArgMap, allEvents, allAddresses, addressToFilePathMap } = targets_all.reduce((result, filePath) => {
  try {
    const targetData = loadJson(filePath); // Load target JSON data
    const address = targetData.address; // Extract the contract address
    
    // Skip if there's no address
    if (!address) return result;
    
    const events = targetData.abi
      .filter(item => item.type === "event") // Filter only events
      .reduce((eventMap, event) => {
        const args = event.inputs.map(input => input.name); // Extract argument names
        eventMap[event.name] = args; // Map event name to its arguments
        result.allEvents.add(event.name); // Add the event name to the global set
        return eventMap;
      }, {});

    // Map address to its events and their arguments
    result.addressEventArgMap[address] = events;

    // Add the address to the set of all addresses
    result.allAddresses.add(address);

    // Map address to the file path it was found in
    result.addressToFilePathMap[address] = filePath.substring(8, filePath.length-5);

  } catch (err) {
    console.error(`Error processing file ${filePath}: ${err.message}`);
  }

  return result;
}, { 
  addressEventArgMap: {}, 
  allEvents: new Set(), 
  allAddresses: new Set(),  // Initialize a set to track all unique addresses
  addressToFilePathMap: {}  // Map to store address -> file path
});

// Convert allAddresses Set to an array for easier handling
const allAddressesList = Array.from(allAddresses);
const allEventsList = Array.from(allEvents);

// console.log("Address Event Arg Map:", addressEventArgMap);
// console.log("All Events:", allEventsList);
// console.log("All Addresses:", allAddressesList);
// console.log("Address to File Path Map:", addressToFilePathMap);




// Database Configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// Helper function to query the database
async function queryDatabase(query, params = []) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(query, params);
    return rows;
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}


// Endpoint for help page
app.get('/help', async (req, res) => {
  try {
    let query = 'SELECT DISTINCT event_name FROM logs';
    let rows = await queryDatabase(query);
    const eventNames = rows.map(row => row.event_name);
    query = 'SELECT DISTINCT contract_address FROM logs';
    rows = await queryDatabase(query);
    const addresses = rows.map(row => row.contract_address); 
    // query = 'SELECT DISTINCT contract_address FROM logs';
    // rows = await queryDatabase(query);
    // const names = rows.map(row => row.contract_address);  
    const helpPage = generateHelpPage(eventNames, addresses, addressToFilePathMap);
    res.send(helpPage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


function parseRowsWithAddressEventArgMap(rows, addressEventArgMap) {
  return rows.map(row => {
    const address = row.contract_address; // Get the contract address from the row
    const eventName = row.event_name; // Get the event name from the row

    // Retrieve argument names from addressEventArgMap
    const argNames =
      addressEventArgMap[address] && addressEventArgMap[address][eventName]
        ? addressEventArgMap[address][eventName]
        : []; // Fallback to an empty array if not found

    // Parse the args JSON string into an array
    const argsArray = JSON.parse(row.args);

    // Map argument names to values
    const namedArgs = argNames.reduce((obj, name, index) => {
      obj[name] = argsArray[index]; // Map argument names to values
      return obj;
    }, {});

    return {
      ...row,
      args: namedArgs, // Replace with mapped argument names
    };
  });
}

// Endpoint for all events stored in database
app.get('/all', async (req, res) => {
  try {
    const query = 'SELECT * FROM logs ORDER BY block_num ASC'; // Fetch all logs from the database
    const rows = await queryDatabase(query);

    // Use the utility function to parse rows
    const parsedRows = parseRowsWithAddressEventArgMap(rows, addressEventArgMap);

    res.json(parsedRows); // Send the transformed rows as JSON response
  } catch (err) {
    res.status(500).json({ error: err.message }); // Handle errors gracefully
  }
});

// Endpoints for sorting by event name
for (let eventName of allEventsList) {
  app.get('/event/' + eventName, async (req, res) => {
    try {
      const query = 'SELECT * FROM logs WHERE event_name = ? ORDER BY block_num ASC';
      const rows = await queryDatabase(query, [eventName]); // Use parameterized query

      // Use the utility function to parse rows
      const parsedRows = parseRowsWithAddressEventArgMap(rows, addressEventArgMap);

      res.json(parsedRows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

// Endpoints for sorting by event name
for (let address of allAddressesList) {
  app.get('/address/' + address, async (req, res) => {
    try {
      const query = 'SELECT * FROM logs WHERE contract_address = ? ORDER BY block_num ASC';
      const rows = await queryDatabase(query, [address]); // Use parameterized query

      // Use the utility function to parse rows
      const parsedRows = parseRowsWithAddressEventArgMap(rows, addressEventArgMap);

      res.json(parsedRows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/name/' + addressToFilePathMap[address], async (req, res) => {
    try {
      const query = 'SELECT * FROM logs WHERE contract_address = ? ORDER BY block_num ASC';
      const rows = await queryDatabase(query, [address]); // Use parameterized query

      // Use the utility function to parse rows
      const parsedRows = parseRowsWithAddressEventArgMap(rows, addressEventArgMap);

      res.json(parsedRows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}


// Catch-all for random or undefined endpoints and redirect to help page
app.get('*', (req, res) => {
  res.redirect('/help');
});


// Server Configuration
const PORT = 3013; // Change the port number here
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});