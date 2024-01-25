#!/usr/bin/env python3

import threading
import timeit
from queue import Queue

from requestHelper import getTokenListByAddress
from util import (bcolors, get_transaction_count, getBalance, getBlockNumber,
                  getSenderWallet, getTransferTokenData, print_with_color,
                  send_raw_transaction, sendTransaction)

sendTxQueue = Queue()

def worker():
    while True:
        rawTransaction = sendTxQueue.get()
        print('Tx count', sendTxQueue.qsize())
        send_raw_transaction(rawTransaction)
        sendTxQueue.task_done()

def transferAllTokens(wallet, toAddress, threadCount = 1):
  global totalnonce

  if threadCount > 1:
    for i in range(threadCount):
      threading.Thread(target=worker).start()

  result = getTokenListByAddress(wallet.address, 0)
  tokensCount = result['total']
  print("Total Tokens", tokensCount)

  for token in result['list']:
    print("Transfer %s: %d / %d" % (token['tick'], i, tokensCount))
    txData = getTransferTokenData(wallet.address, toAddress, token['tick'], token['amount'], totalnonce)
    totalnonce = totalnonce + 1
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

transferAllTokens(wallet, '0x59e2A9d3a4F492c6277Fe18b5CD6bf84E339eE33', 2)
printTime()
