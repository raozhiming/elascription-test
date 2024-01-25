
const moment = require("moment");
const cryptoJS = require('crypto-js'); // Import encryption modules for subsequent encryption calculations
const axios = require("axios");
const fs = require("fs");

const brc20TokenListUrlPre = '/api/v5/explorer/brc20/token-list?limit=50&page=';

// type BRC20Token = {
//   token: string,
//   deployTime: string,
//   inscriptionId: string,
//   inscriptionNumber: string,
//   totalSupply: string,
//   mintAmount: string,
//   transactionCount: string,
//   holder: string,
//   mintRate: string
// }

// type BRC20TokenListResponse = {
//   page: string,
//   limit: string,
//   totalPage: string,
//   tokenList: BRC20Token[]
// }

async function getBRC20TokenList(page) {
  let brc20TokenListUrl = brc20TokenListUrlPre + page;
  let timestamp = (new Date()).getTime()

  let config = require('./config-okx.json');

  const headersParams = {
    'Content-Type': 'application/json',
    'OK-ACCESS-KEY': config.api_key,
    'OK-ACCESS-SIGN': cryptoJS.enc.Base64.stringify(
      cryptoJS.HmacSHA256(timestamp + 'GET' + brc20TokenListUrl, config.secret_key)
    ),
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE': config.passphrase,
  };

  let url = config.apiurl + brc20TokenListUrl;
  try {
    let res = await axios.get(url, { headers : headersParams});
    return res.data?.data[0];
  } catch (e) {
    console.warn("axios.get error:", e);
    return undefined;
  }
}

void (async () => {
  let tokenList = [];
  let currentPage = 1;
  let result;

  let hoderThreshold = 100;
  let mintRateThreshold = 0.2;
  do {
    result = await getBRC20TokenList(currentPage);
    console.log('Page:', currentPage, ' / ', result.totalPage)
    result.tokenList.forEach( t => {
      if ((parseInt(t.holder) >= hoderThreshold) && (parseFloat(t.mintRate) >= mintRateThreshold)) {
        tokenList.push(t)
      }
    })
    currentPage++;
  } while (result.totalPage > currentPage)

  console.log("token count:", tokenList.length)

  fs.writeFile(
    './brc20tokenlist.json',

    JSON.stringify(tokenList, null, 2),

    function (err) {
        if (err) {
            console.error('error', err);
        }
    }
  );

})();