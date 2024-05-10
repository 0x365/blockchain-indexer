// Indexer and Cacher for a specific smart contract

// Author: Robert Cowlishaw (0x365)

// WIP
// - Functionality for overlapping between backtrack and listener not implemented yet
// - Known Error - If backtrack returns more than 1000, error occurs 


const { Web3 } = require('web3');
const ethers = require('ethers');
const mysql = require('mysql');
require("dotenv").config()

// Get contract details
const {contractAddress, deploymenBlock, contractABI} = require('./target.js')

// Start message
console.log("Beginning routine for contract at address", contractAddress);


// Define database to connect too
var con = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_DATABASE
});


con.connect(function(err) {
    // Connect to database
    if (err) console.log(err);
    console.log("Connected!");

    


    let event_name = "Transfer"

    // Create table if it does not exist
    
    var sql = "CREATE TABLE IF NOT EXISTS "+event_name+" (blockNumber TEXT, transactionHash TEXT, sender TEXT, reciever TEXT, value TEXT);";
    con.query(sql, function (err, result) {
      if (err) console.log(err);
      console.log("Table created");
    });


    // Backup

    const web3 = new Web3(process.env.URL_HTTP)
    const contract_http = new web3.eth.Contract(contractABI, contractAddress);

    let options = {
        fromBlock: deploymenBlock,                  //Number || "earliest" || "pending" || "latest"
        toBlock: 'latest'
    };
    contract_http.getPastEvents(event_name, options)
        .then(results => {
            var sql = "INSERT INTO "+event_name+" (blockNumber, transactionHash, sender, reciever, value) VALUES ('"+results.blockNumber+"', '"+results.transactionHash+"', '"+results.returnValues[0]+"', '"+results.returnValues[1]+"', '"+results.returnValues[2]+"')";
            // console.log(from, to, value, event)
            con.query(sql, function (err, result) {
                if (err) console.log(err);
                console.log("1 record inserted - starter");
            });
        })
        .catch(err => console.log(err));


    // Listener

    const webSocketProvider = new ethers.providers.WebSocketProvider(process.env.URL_WEBSOCKET);
    const contract_ws = new ethers.Contract(contractAddress, contractABI, webSocketProvider);
    
    contract_ws.on(event_name, (from, to, value, event) => {    
        // console.log(event)    
        var sql = "INSERT INTO "+event_name+" (blockNumber, transactionHash, sender, reciever, value) VALUES ('"+event.blockNumber+"', '"+event.transactionHash+"', '"+from+"', '"+to+"', '"+value+"')";
            // console.log(from, to, value, event)
        con.query(sql, function (err, result) {
            if (err) console.log(err);
            console.log("1 record inserted");
        });
    })
    .on('error', function(error){ console.log(error) });

    

    
});