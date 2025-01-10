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

