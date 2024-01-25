#!/usr/bin/env python3

import json
import math
import threading
import timeit
from queue import Queue

from eth_account import Account
from eth_account.signers.local import LocalAccount
from requestHelper import getESC20TokenList
from web3 import Web3

q = Queue()

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

def worker():
    while True:
        rawTransaction = q.get()
        print('Remain Tx count', q.qsize())
        w3.eth.send_raw_transaction(rawTransaction)
        q.task_done()

def getWallet(privatekey):
  account: LocalAccount = w3.eth.account.from_key(str(privatekey))
  return  account

def getBalance(address):
  balanceWei = w3.eth.get_balance(address)
  return w3.from_wei(balanceWei, 'ether')

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

def sendTransaction(wallet, txData):
  global totalnonce
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

def getAllESC20Tokens(limit = 50):
  print('limit ', limit)
  allTokenList = []
  result = getESC20TokenList(1, limit)
  # print(result['list'])
  allTokenList = allTokenList + result['list']
  # for token in result['list']:
  #   allTokenList.append(token)

  pages = math.ceil(int(result["total"]) / limit)
  for page in range(2, pages + 1):
    result = getESC20TokenList(page, limit)
    print('Fetching Page:', page, ' / ', pages)
    # print(result['list'])
    allTokenList = allTokenList + result['list']
    # for token in result['list']:
    #   allTokenList.append(token)

  # print("All ESC20 token count", len(allTokenList))
  return allTokenList

def deployAndMintSingleThread(brc20toeknlist):
  global totalnonce
  count=0
  for token in brc20toeknlist:
    count = count + 1
    print("%d / %d" % (count, len(brc20toeknlist)))

    txData = getDeployTokenData(wallet.address, token['token'], token['totalSupply'], token['totalSupply'], totalnonce)
    totalnonce = totalnonce + 1
    sendTransaction(wallet, txData)

    txData = getMintTokenData(wallet.address, token['token'], token['totalSupply'], totalnonce)
    totalnonce = totalnonce + 1
    sendTransaction(wallet, txData)

def deployAndMintMultiThread(brc20toeknlist, threadCount):
  global totalnonce
  sendTx_threads = []
  for i in range(0, threadCount):  # 创建1个线程用于read()，并添加到read_threads列表
    t = threading.Thread(target=worker) # 执行的函数如果需要传递参数，threading.Thread(target=函数名,args=(参数，逗号隔开))
    sendTx_threads.append(t)

  for i in range(0,threadCount):  # 启动存放在read_threads和write_threads列表中的线程
    sendTx_threads[i].start()

  count=0
  for token in brc20toeknlist:
    count = count + 1
    print(" Deploy %d / %d" % (count, len(brc20toeknlist)))

    txData = getDeployTokenData(wallet.address, token['token'], token['totalSupply'], token['totalSupply'], totalnonce)
    totalnonce = totalnonce + 1
    signed_txn = wallet.sign_transaction(txData)
    q.put(signed_txn.rawTransaction)

  q.join()
  printTime()

  count = 0
  for token in brc20toeknlist:
    count = count + 1
    print("Mint %d / %d" % (count, len(brc20toeknlist)))
    txData = getMintTokenData(wallet.address, token['token'], token['totalSupply'], totalnonce)
    totalnonce = totalnonce + 1
    signed_txn = wallet.sign_transaction(txData)
    q.put(signed_txn.rawTransaction)
  q.join()
  printTime()

def printTime():
  elapsed = timeit.default_timer() - startTime
  minutes = elapsed / 60
  seconds = elapsed % 60
  print_with_color(bcolors.OKGREEN, 'elapsed time [%d min %0.2fs]' % (minutes, seconds))

startTime = timeit.default_timer()

with open('brc20tokenlist.json', 'r') as brc20tokenlistJson:
  brc20toeknlist = json.loads(brc20tokenlistJson.read())

with open('config.json', 'r') as configJson:
  config = json.loads(configJson.read())

w3 = Web3(Web3.HTTPProvider(config['rpc']))
# w3 = Web3(Web3.HTTPProvider(config['rpclocal']))

wallet = getWallet(config['privatekey'])

blockNumber = getBlockNumber()
print("blockNumber:", blockNumber)

balance = getBalance(wallet.address)
print("Balance:", balance)

totalnonce = w3.eth.get_transaction_count(wallet.address, 'latest')
print("Nonce:", totalnonce)


# Filter out tokens that have been deployed
# allESC20TokenList = getAllESC20Tokens()

# noDeployTokens = []
# for brcToken in brc20toeknlist:
#   find = False
#   for erctoken in allESC20TokenList:
#     if brcToken['token'] ==  erctoken['tick']:
#       find = True
#       break
#   if not find:
#      noDeployTokens.append(brcToken)

# print("noDeployTokens:", len(noDeployTokens))

print("brc20toeknlist:", len(brc20toeknlist))

# deployAndMintSingleThread(brc20toeknlist)
# deployAndMintMultiThread(brc20toeknlist, 10)

print('All finished')
