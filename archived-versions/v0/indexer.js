// Indexer and Cacher for a specific smart contract

// Author: Robert Cowlishaw (0x365)

// WIP
// - If turned off and on again, it will just fill database with repeat data
// - If archive returns more than 1000, error occurs 
// - Currently only handles 1 event at a time
// - Archiver shows count higher than what actually gets submitted


const { Web3 } = require('web3');
const ethers = require('ethers');
const mysql = require('mysql');
require("dotenv").config()

// Get contract details
const {contractAddress, deploymentBlock, contractABI} = require('./target.js')

// Start message
console.log("Beginning routine for contract at address", contractAddress);


// Define database to connect too
var con = mysql.createConnection({
  host: process.env.DATABASE_URL,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_DATABASE
});
  

con.connect(function(err) {
    // Connect to database
    if (err) throw (err);
    console.log("Connected to database");


    // This is currently left here as mysql INSERT sender,reciever,value are specific to this.
    let event_name = "Transfer"

    // Create table if it does not exist
    
    var sql = "CREATE TABLE IF NOT EXISTS "+event_name+" (blockNumber TEXT, transactionHash TEXT, sender TEXT, reciever TEXT, value TEXT);";
    con.query(sql, function (err, result) {
      if (err) throw (err);
      console.log("Table created");
    });


    // Archive

    const web3 = new Web3(process.env.URL_HTTP)
    const contract_http = new web3.eth.Contract(contractABI, contractAddress);

    let options = {
        fromBlock: deploymentBlock,
        toBlock: 'latest'
    };

    contract_http.getPastEvents(event_name, options)
        .then(results => {
            var archive_count = 0;
            console.log("Here")
            for (let i = 0; i < results.length; i++) {
                var single_res = results[i]
                var sql = "INSERT INTO "+event_name+" (blockNumber, transactionHash, sender, reciever, value) VALUES ('"
                    +single_res.blockNumber+"', '"+single_res.transactionHash+"', '"+single_res.returnValues[0]+"', '"
                    +single_res.returnValues[1]+"', '"+single_res.returnValues[2]+"')";
                con.query(sql, function (err, result) {
                    if (err) throw (err);
                    archive_count += 1;
                    if (archive_count == results.length) {
                        console.log(archive_count, "records archived")
                    }
                });
            }
            
        })
        .catch(err => {throw (err)});


    // Listener

    const webSocketProvider = new ethers.providers.WebSocketProvider(process.env.URL_WEBSOCKET);
    const contract_ws = new ethers.Contract(contractAddress, contractABI, webSocketProvider);
    
    var listener_count = 0;
    contract_ws.on(event_name, (from, to, value, event) => {    
        var sql = "INSERT INTO "+event_name+" (blockNumber, transactionHash, sender, reciever, value) VALUES ('"
            +event.blockNumber+"', '"+event.transactionHash+"', '"+from+"', '"+to+"', '"+value+"')";
        con.query(sql, function (err, result) {
            if (err) throw (err);
            // console.log("1 record inserted");
            listener_count += 1;
            if (listener_count % 100 == 0) {
                console.log(listener_count, "records collected")
            }
        });
    })
    .on('error', function(error){ throw (err) });

    

    
});
