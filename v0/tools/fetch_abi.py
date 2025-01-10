#!/usr/bin/python
import argparse
import requests
import json
import os

# Get ABI from address by scanning etherscan. Cant always find abi.

ABI_ENDPOINT = 'https://api.etherscan.io/api?module=contract&action=getabi&address='

parser = argparse.ArgumentParser()
parser.add_argument('addr', type=str, help='Contract address')

def save_json(file_name, data):
    with open(file_name,'w') as f:
        json.dump(data, f)

def __main__():

    args = parser.parse_args()

    response = requests.get(ABI_ENDPOINT+args.addr)
    response_json = response.json()
    abi_json = json.loads(response_json['result'])
    result = json.dumps({"abi":abi_json}, indent=4, sort_keys=True)

    save_location = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "abi.json")
    save_json(save_location, result)

if __name__ == '__main__':
    __main__()