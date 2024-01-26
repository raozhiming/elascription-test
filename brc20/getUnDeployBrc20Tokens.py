#!/usr/bin/env python3

import json
import math
import timeit

from requestHelper import getESC20TokenList


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

def getAllESC20Tokens(limit = 50):
  allTokenList = []
  result = getESC20TokenList(1, limit)
  allTokenList = allTokenList + result['list']

  pages = math.ceil(int(result["total"]) / limit)
  for page in range(2, pages + 1):
    result = getESC20TokenList(page, limit)
    print('Fetching Page:', page, ' / ', pages)
    allTokenList = allTokenList + result['list']

  return allTokenList

def printTime():
  elapsed = timeit.default_timer() - startTime
  minutes = elapsed / 60
  seconds = elapsed % 60
  print_with_color(bcolors.OKGREEN, 'elapsed time [%d min %0.2fs]' % (minutes, seconds))

startTime = timeit.default_timer()

with open('brc20tokenlist.json', 'r') as brc20tokenlistJson:
  brc20toeknlist = json.loads(brc20tokenlistJson.read())

# Filter out tokens that have been deployed
allESC20TokenList = getAllESC20Tokens(100)

unDeployTokens = []
for brcToken in brc20toeknlist:
  find = False
  for erctoken in allESC20TokenList:
    if brcToken['token'] ==  erctoken['tick']:
      find = True
      break
  if not find:
     unDeployTokens.append(brcToken)

print("unDeployTokens:", unDeployTokens)
print("unDeployTokens:", len(unDeployTokens))

with open("./undeploybrc20tokenlist.json", 'w') as file:
  file.write(json.dumps(unDeployTokens, indent=2))

print('All finished')
printTime()
