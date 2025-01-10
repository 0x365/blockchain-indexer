from web3 import Web3
from datetime import datetime
import json
import os
import csv


def load_json(file_name):
    with open(file_name) as f:
        output = json.load(f)
    return output

# Output
def csv_output(file_name, data_send):
    with open(file_name, "w") as f:
        if len(data_send) == 0:
            f.close()
            return
        else:
            for item in data_send:
                csv.writer(f).writerow(item)
            f.close()
            return


# Connect to Infura
infura_url = load_json(".api.json")["mainnet"]
web3 = Web3(Web3.HTTPProvider(infura_url))

# Check connection
if not web3.is_connected():
    print("Unable to connect to the Ethereum network.")
    exit()


# Contract details
contract_address = load_json("target.json")["address"]
contract_abi = load_json("target.json")["abi"]
contract_deployed_block= load_json("target.json")["deploy_block"]

file_path = "last_block.txt"
if os.path.exists(file_path):
    with open(file_path, 'r') as file:
        content = file.read()
        contract_deployed_block = int(content)


# Initialize the contract
contract = web3.eth.contract(address=contract_address, abi=contract_abi)

latest_block_number = web3.eth.block_number

#################### NEEEDDD TOOO MAKE CONTRACTCREATED FUNCTION CHANGEABLE ############################
# logs = contract.events.ContractCreated().get_logs(from_block=contract_deployed_block, to_block=latest_block_number)

def fetch_logs_in_chunks(from_block, to_block, chunk_size=10000, retry_limit=3):
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
                logs = contract.events.Transfer().get_logs(from_block=current_block, to_block=end_block)
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

# Fetch logs from contract deployment block to the latest block in smaller chunks
logs = fetch_logs_in_chunks(contract_deployed_block, latest_block_number)


if not os.path.exists(file_path):
    with open(file_path, 'w') as file:
        file.write(str(latest_block_number+1))


##### REPLACE WITH MYSQL

csv_array = [["block_num", "log_index", "tx_hash", *list(logs[0]["args"].keys())]]
for log in logs:
    block_num = log.blockNumber
    log_index = log.logIndex
    tx_hash = log.transactionHash.hex()
    args = log["args"]
    csv_array.append([block_num, log_index, tx_hash, *list(args.values())])

csv_output("test_csv.csv", csv_array)





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
