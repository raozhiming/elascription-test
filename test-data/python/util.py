#!/usr/bin/env python3

import json

from eth_account.signers.local import LocalAccount
from web3 import Web3


class bcolors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_with_color(color, message):
    print(color + message + bcolors.ENDC)

def getWallet(privatekey):
  account: LocalAccount = w3.eth.account.from_key(str(privatekey))
  return  account

def getSenderWallet():
  return getWallet(config['privatekey'])

def getBalance(address):
  balanceWei = w3.eth.get_balance(address)
  return w3.from_wei(balanceWei, 'ether')

def get_transaction_count(address):
   return w3.eth.get_transaction_count(address, 'latest')

def getBlockNumber():
  return w3.eth.get_block_number()

def getDeployTokenData(address, tick, totalSupply, limitPerMint, nonce = None):
    data = "data:,{\"p\":\"esc-20\",\"op\":\"deploy\",\"tick\":\"%s\",\"max\":\"%s\",\"lim\":\"%s\"}" % (tick, totalSupply, limitPerMint)

    txData = {
      'from': address,
      'to': address,
      'gas': 100000,
      'gasPrice': 1000000000,
      'value': 0,
      'data': w3.to_hex(data.encode())
    }

    if (nonce):
      txData['nonce'] = nonce

    return txData

def getMintTokenData(address, tick, amount, nonce = None):
    data = "data:,{\"p\":\"esc-20\",\"op\":\"mint\",\"tick\":\"%s\",\"amt\":\"%s\"}" % (tick, amount)

    txData = {
      'from': address,
      'to': address,
      'gas': 100000,
      'gasPrice': 1000000000,
      'value': 0,
      'data': w3.to_hex(data.encode())
    }

    if (nonce):
      txData['nonce'] = nonce

    return txData

def getTransferTokenData(fromAddress, toAddress, tick, amount, nonce = None):
    data = "data:,{\"p\":\"esc-20\",\"op\":\"transfer\",\"tick\":\"%s\",\"amt\":\"%s\"}" % (tick, amount)

    txData = {
      'from': fromAddress,
      'to': toAddress,
      'gas': 100000,
      'gasPrice': 1000000000,
      'value': 0,
      'data': w3.to_hex(data.encode())
    }

    if (nonce):
      txData['nonce'] = nonce

    return txData

def getTransferNativeTokenData(fromAddress, toAddress, amount, nonce = None):
    txData = {
      'from': fromAddress,
      'to': toAddress,
      'gas': 100000,
      'gasPrice': 1000000000,
      'value': w3.to_wei(amount, 'ether'),
    }

    if (nonce):
      txData['nonce'] = nonce

    return txData

def sendTransaction(wallet, txData):
  signed_txn = wallet.sign_transaction(txData)
  try:
      result = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
  except ValueError as e:
      print('Error:')
      # 发送交易 如果有replacement transaction underpriced 重新获取nonce
      totalnonce = w3.eth.get_transaction_count(wallet.address, 'pending')
      txData['nonce'] = totalnonce
      signed_txn = wallet.sign_transaction(txData)
      result = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
      # print(result)

def send_raw_transaction(rawTransaction):
  w3.eth.send_raw_transaction(rawTransaction)


with open('config.json', 'r') as configJson:
  config = json.loads(configJson.read())

w3 = Web3(Web3.HTTPProvider(config['rpc']))
