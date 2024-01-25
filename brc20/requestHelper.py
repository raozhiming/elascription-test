#!/usr/bin/env python3

import http.client
import json
from urllib.parse import quote_plus, urlencode


def send_get_request(request_path, params):
    conn = http.client.HTTPSConnection(rpcurl)
    params_encoded = urlencode(params, quote_via=quote_plus) if params else None
    conn.request("GET", request_path + f'?{params_encoded}' if params_encoded else request_path, headers=None)

    response = conn.getresponse()
    data = response.read()

    return data.decode("utf-8")

def send_post_request(request_path, params):
    conn = http.client.HTTPSConnection(rpcurl)
    params_encoded = json.dumps(params) if params else ''

    headersParams = {
      'Content-Type': 'application/json',
    }

    conn.request("POST", request_path, body=params_encoded, headers=headersParams)

    response = conn.getresponse()
    data = response.read()

    return data.decode("utf-8")

def getTokenListByAddress(address, page = 0):
  param = {
    "page": page,
    "limit": 50,
    "owner": address,
  }
  ret = send_post_request('/esc20/tokens', param)
  result = json.loads(ret)
  return result['data']

def getESC20TokenList(page = 0, limit = 50):
  param = {
    "page": page,
    "limit": limit,
  }
  ret = send_post_request('/esc20/list', param)
  result = json.loads(ret)
  return result['data']

with open('config.json', 'r') as configJson:
  config = json.loads(configJson.read())
  rpcurl = config['apiurl']
