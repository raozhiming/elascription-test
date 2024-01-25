#!/usr/bin/env python3

import base64
import hashlib
import hmac
import http.client
import json
import timeit
from datetime import datetime
from urllib.parse import quote_plus, urlencode

# BRC20TokenListUrlPre = '/api/v5/explorer/brc20/token-list?limit=50&page='
# The maximum value of limit is 100
BRC20TokenListUrlPre = '/api/v5/explorer/brc20/token-list?limit=100&page='
BRC20TokenDetailUrlPre = '/api/v5/explorer/brc20/token-details?token='

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


def pre_hash(timestamp, method, request_path, params):
    # 根据字符串和参数创建预签名
    query_string = ''
    if method == 'GET' and params:
        query_string = '?' + urlencode(params)
    if method == 'POST' and params:
        query_string = json.dumps(params)
    return timestamp + method + request_path + query_string

def sign(message, secret_key):
    # 使用 HMAC-SHA256 对预签名字符串进行签名
    mac = hmac.new(bytes(secret_key, encoding='utf8'), bytes(message, encoding='utf-8'), hashlib.sha256)
    d = mac.digest()
    return base64.b64encode(d).decode('utf-8')

def create_signature(method, request_path, params):
    # 获取 ISO 8601 格式时间戳
    timestamp = datetime.utcnow().isoformat()[:-3] + 'Z'
    # 生成签名
    message = pre_hash(timestamp, method, request_path, params)
    signature = sign(message, api_config['secret_key'])

    return signature, timestamp

def send_get_request(request_path, params):
    # 生成签名
    signature, timestamp = create_signature("GET", request_path, params)

    # 生成请求头
    headers = {
        'OK-ACCESS-KEY': api_config['api_key'],
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': api_config['passphrase'],
        # 'OK-ACCESS-PROJECT': api_config['project'] # 这仅适用于 WaaS APIs
    }

    # 使用 http.client 库发送 GET 请求
    conn = http.client.HTTPSConnection("www.okx.com")
    params_encoded = urlencode(params, quote_via=quote_plus) if params else None
    conn.request("GET", request_path + f'?{params_encoded}' if params_encoded else request_path, headers=headers)

    # 接收响应
    response = conn.getresponse()
    data = response.read()

    return data.decode("utf-8")

def send_post_request(request_path, params):
    # 生成签名
    signature, timestamp = create_signature("POST", request_path, params)

    # 生成请求头
    headers = {
        'OK-ACCESS-KEY': api_config['api_key'],
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': api_config['passphrase'],
        # 'OK-ACCESS-PROJECT': api_config['project'], # 这仅适用于 WaaS APIs
        'Content-Type': 'application/json'  # POST 请求需要加上这个头部
    }

    # 使用 http.client 库发送 POST 请求
    conn = http.client.HTTPSConnection("www.okx.com")
    params_encoded = json.dumps(params) if params else ''
    conn.request("POST", request_path, body=params_encoded, headers=headers)

    # 接收响应
    response = conn.getresponse()
    data = response.read()

    return data.decode("utf-8")

def getBRC20TokenList(page):
  brc20TokenListUrl = BRC20TokenListUrlPre + str(page)
  req = send_get_request(brc20TokenListUrl, None)
  result = json.loads(req)
  return result["data"][0]

def getBRC20TokenDetail(token):
  brc20TokenDetailUrl = BRC20TokenDetailUrlPre + token
  req = send_get_request(brc20TokenDetailUrl, None)
  result = json.loads(req)
  return result["data"][0]

def printTime():
  elapsed = timeit.default_timer() - startTime
  minutes = elapsed / 60
  seconds = elapsed % 60
  print_with_color(bcolors.OKGREEN, 'elapsed time [%d min %0.2fs]' % (minutes, seconds))

startTime = timeit.default_timer()

with open('config-okx.json', 'r') as configJson:
  api_config = json.loads(configJson.read())

tokenList = []
alltokenList = []
hoderThreshold = 100
mintRateThreshold = 0.2

# ret = getBRC20TokenDetail('bel2')
# print(ret)

bel2 = {
  "token": "bel2",
  "totalSupply": "2100000000000000",
  "mintAmount": "2100000000000000",
}

result = getBRC20TokenList(1)
for token in result['tokenList']:
  if (int(token['holder']) >= hoderThreshold) and (float(token['mintRate']) >= mintRateThreshold):
    tokenList.append(token)

pages = int(result["totalPage"])
for page in range(2, pages + 1):
  result = getBRC20TokenList(page)
  print('Fetching Page:', page, ' / ', pages)
  for token in result['tokenList']:
    if (int(token['holder']) >= hoderThreshold) and (float(token['mintRate']) >= mintRateThreshold):
      tokenList.append(token)

find = False
for brcToken in tokenList:
  if brcToken['token'] == 'bel2':
    find = True
    break
if not find:
    print("The bel2 isn't in list, add it manualy")
    tokenList.append(bel2)

print("Token count", len(tokenList))

with open("./brc20tokenlist.json", 'w') as file:
  file.write(json.dumps(tokenList, indent=2))

print('All finished')
printTime()