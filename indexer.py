from web3 import Web3
from datetime import datetime
import json
import os
import csv

from commons import *

##########################################

target_file_name = "target_small.json"
ticker_file_name = "last_block.txt"
api_key_file_name = ".api.json"

##########################################

def fetch_logs_in_chunks(from_block, to_block, contract_event, chunk_size=10000, retry_limit=3):
    all_logs = []
    current_block = from_block
    attempt = 0

    while current_block <= to_block:
        # Calculate the end block for this chunk
        end_block = min(current_block + chunk_size - 1, to_block)

        print(f"Fetching logs from block {current_block} to block {end_block}...")

        while attempt < retry_limit:
            try:
                # Fetch logs for the current block range
                event = getattr(contract.events, contract_event)
                logs = event().get_logs(from_block=current_block, to_block=end_block)
                all_logs.extend(logs)
                if len(logs) < 4000:
                    chunk_size = int(chunk_size * 2)
                break
            except Exception as e:
                print(f"Error fetching logs from block {current_block} to block {end_block}: {e}")
                attempt += 1
                if attempt == retry_limit:
                    print(f"Reached retry limit. Moving on to the next range.")
                else:
                    # Dynamically reduce the chunk size if we exceed the limit
                    print("Retrying with a smaller chunk size...")
                    chunk_size = chunk_size // 2
                    break

        # Move to the next chunk
        current_block = end_block + 1
        attempt = 0

    return all_logs

##########################################

# Contract details
target = load_json(target_file_name)
contract_network_name = target["network"]
contract_address = target["address"]
contract_abi = target["abi"]
contract_deployed_block= target["deploy_block"]
contract_events = target["contract_events"]

if os.path.exists(ticker_file_name):
    with open(ticker_file_name, 'r') as file:
        content = file.read()
        contract_deployed_block = int(content)

# Connect to Infura
infura_api_urls = load_json(api_key_file_name)
if not contract_network_name in infura_api_urls.keys():
    raise Exception("Target network name does not have API to ping")

infura_url = infura_api_urls[contract_network_name]
web3 = Web3(Web3.HTTPProvider(infura_url))

# Check connection
if not web3.is_connected():
    print("Unable to connect to the Ethereum network.")
    exit()

# Initialize the contract
contract = web3.eth.contract(address=contract_address, abi=contract_abi)

latest_block_number = web3.eth.block_number




# Fetch logs from contract deployment block to the latest block in smaller chunks
for contract_event in contract_events:
    logs = fetch_logs_in_chunks(contract_deployed_block, latest_block_number, contract_event)

    ##### REPLACE WITH MYSQL

    if len(logs) > 0:
        print(len(logs), "events found")
        csv_array = [["block_num", "log_index", "tx_hash", *list(logs[0]["args"].keys())]]
        for log in logs:
            block_num = log.blockNumber
            log_index = log.logIndex
            tx_hash = log.transactionHash.hex()
            args = log["args"]
            csv_array.append([block_num, log_index, tx_hash, *list(args.values())])

        csv_output("database_"+contract_event+".csv", csv_array)
    else:
        print("No events found")



if not os.path.exists(ticker_file_name):
    with open(ticker_file_name, 'w') as file:
        file.write(str(latest_block_number+1))



# Next steps

# import mysql.connector

# mydb = mysql.connector.connect(
#   host="localhost",
#   user="yourusername",
#   password="yourpassword",
#   database="mydatabase"
# )

# mycursor = mydb.cursor()

# sql = "INSERT INTO customers (name, address) VALUES (%s, %s)"
# val = [
#   ('Peter', 'Lowstreet 4'),
#   ('Amy', 'Apple st 652'),
#   ('Hannah', 'Mountain 21'),
#   ('Michael', 'Valley 345'),
#   ('Sandy', 'Ocean blvd 2'),
#   ('Betty', 'Green Grass 1'),
#   ('Richard', 'Sky st 331'),
#   ('Susan', 'One way 98'),
#   ('Vicky', 'Yellow Garden 2'),
#   ('Ben', 'Park Lane 38'),
#   ('William', 'Central st 954'),
#   ('Chuck', 'Main Road 989'),
#   ('Viola', 'Sideway 1633')
# ]

# mycursor.executemany(sql, val)

# mydb.commit()
