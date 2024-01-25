#!/usr/bin/env python3

import json
import threading
import timeit
from queue import Queue

from util import (bcolors, get_transaction_count, getBalance, getBlockNumber,
                  getSenderWallet, getTransferNativeTokenData,
                  print_with_color, send_raw_transaction, sendTransaction)

sendTxQueue = Queue()

def worker():
    while True:
        rawTransaction = sendTxQueue.get()
        print('Tx count', sendTxQueue.qsize())
        send_raw_transaction(rawTransaction)
        sendTxQueue.task_done()

def initTestWallets(minBalance, checkBalance = False, threadCount = 1):
  global totalnonce
  with open('accounts.json', 'r') as accountsJson:
    accounts = json.loads(accountsJson.read())
  addresses = list(accounts['accounts'].keys())
  addressCount = len(addresses)

  if threadCount > 1:
    for i in range(threadCount):
      threading.Thread(target=worker).start()

  count = 1
  transferCount = 0
  for address in addresses:
    print(" %d / %d" % (count, addressCount))
    count = count + 1

    if count > 10:
      break

    needTransfer = True
    # TODO: use thread to check balance
    if checkBalance:
      balance = getBalance(address)
      print('Balance of ', address, ' ', balance)
      if balance >= minBalance:
        needTransfer = False

    if needTransfer:
      txData = getTransferNativeTokenData(wallet.address, address, minBalance, totalnonce)
      totalnonce = totalnonce + 1
      transferCount = transferCount + 1
      # print(txData)
      if threadCount == 1:
        sendTransaction(wallet, txData)
      else:
        signed_txn = wallet.sign_transaction(txData)
        sendTxQueue.put(signed_txn.rawTransaction)

  sendTxQueue.join()
  print('Transfer ELA for %d addresses' % transferCount)

def printTime():
  elapsed = timeit.default_timer() - startTime
  minutes = elapsed / 60
  seconds = elapsed % 60
  print_with_color(bcolors.OKGREEN, 'elapsed time [%d min %0.2fs]' % (minutes, seconds))

startTime = timeit.default_timer()

wallet = getSenderWallet()

blockNumber = getBlockNumber()
print("blockNumber:", blockNumber)

balance = getBalance(wallet.address)
print("Balance:", balance)

totalnonce = get_transaction_count(wallet.address)
print("Nonce:", totalnonce)

initTestWallets(0.00001, True, 3)

printTime()
