#!/usr/bin/env python3

import json
import threading
import timeit
from queue import Queue

from util import (bcolors, get_transaction_count, getBalance, getBlockNumber,
                  getDeployTokenData, getMintTokenData, getSenderWallet,
                  getWallet, print_with_color, send_raw_transaction,
                  sendTransaction)

sendTxQueue = Queue()

def worker():
    while True:
        rawTransaction = sendTxQueue.get()
        print('Tx count', sendTxQueue.qsize())
        send_raw_transaction(rawTransaction)
        sendTxQueue.task_done()

def deployTick(wallet, tickPre, totalSupply, limitPerMint, count = 1):
   global totalnonce

   for i in range(count):
      tick = "%s%s" % (tickPre, str(i).zfill(3))
      print("Deploy %s: %d / %d" % (tick, i, count))
      print(tick)

      txData = getDeployTokenData(wallet.address, tick, totalSupply, limitPerMint, totalnonce)
      totalnonce = totalnonce + 1
      sendTransaction(wallet, txData)

def mintTick(wallet, tick, amt, mintCount = 1, threadCount = 1):
  global totalnonce

  if threadCount > 1:
    for i in range(threadCount):
      threading.Thread(target=worker).start()

  for i in range(mintCount):
    print("Mint %s: %d / %d" % (tick, i, mintCount))
    txData = getMintTokenData(wallet.address, tick, amt, totalnonce)
    totalnonce = totalnonce + 1
    # print(txData)
    if threadCount == 1:
      sendTransaction(wallet, txData)
    else:
      signed_txn = wallet.sign_transaction(txData)
      sendTxQueue.put(signed_txn.rawTransaction)

  sendTxQueue.join()

def mintTickWithMultiAccount(tick, amt, accountCount = 1, threadCount = 1):
  global totalnonce

  with open('accounts.json', 'r') as accountsJson:
    accounts = json.loads(accountsJson.read())
  privateKyes = list(accounts['accounts'].values())

  if threadCount > 1:
    for i in range(threadCount):
      threading.Thread(target=worker).start()

  for i in range(accountCount):
    print("Mint %s: %d / %d" % (tick, i, accountCount))
    wallet = getWallet(privateKyes[i])

    txData = getMintTokenData(wallet.address, tick, amt)
    # print(txData)
    if threadCount == 1:
      sendTransaction(wallet, txData)
    else:
      signed_txn = wallet.sign_transaction(txData)
      sendTxQueue.put(signed_txn.rawTransaction)

  sendTxQueue.join()

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


# deployTick(wallet, 'esc', 210000, 1000, 1)
# mintTick(wallet, 'test', 1000, 1, 1)
# mintTickWithMultiAccount("", 100)
printTime()


print('All finished')
