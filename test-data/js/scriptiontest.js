
const moment = require("moment");
const Util = require("./util.js")
const HttpHelper = require("./httphelper.js")
const { BehaviorSubject }  = require('rxjs');

const { axios, AxiosResponse } =require("axios");

let signedTxlist = {}
let signedTxCount = 0;
let totalTxCount = 0;
let totalConfirmedTxCount = 0;
let signTxStatus = new BehaviorSubject(0);

async function prepareSignedTransaction(walletAccount, txData) {
  let signedTransaction = '';
  try {
    signedTransaction = await Util.signTransaction(walletAccount, txData);
  } catch (e) {
    signedTransaction = await Util.signTransaction(walletAccount, txData);
  }
  if (txData.nonce) {
    signedTxlist[txData.nonce] = signedTransaction;
  } else {
    signedTxlist[txData.from] = signedTransaction;
  }

  signedTxCount++;
  if (signedTxCount >= totalTxCount) {
    // console.warn('signed tx list:', Object.keys(signedTxlist).length, signedTxlist)
    signTxStatus.next(signedTxCount)
  }
  return
}

async function waitForSignTx() {
  return new Promise(async (resolve, reject) => {
     signTxStatus.subscribe( (count)=> {
      if (count > 0) {
        resolve();
      }
    })
  });
}


async function deployTick(tickPre, totalSupply, limitPerMint, count = 1) {
  let config = require('./config.json');
  let walletSender = await Util.getWalletAccount(config.privatekey)
  let balance = await Util.getBalance(walletSender.address)
  console.log('Sender balance:', walletSender.address, balance)

  let nonce = null;
  if (count > 1) {
    nonce = await Util.getTransactionCount(walletSender.address)
    console.log('nonce:', nonce)
  }

  let startIndex = 0;
  totalTxCount = count;
  for (let i = startIndex; i < count + startIndex; i++) {
    let tick = tickPre;
    if (count > 1) {
      tick = tickPre + '-' + i.toString().padStart(4, '0');
    }
    console.log(moment(new Date().getTime()).format('HH:mm:ss.SSS') + " ", ' Count:', i + 1, tick)
    try {
      const txData = Util.getDeployTokenData(walletSender.address, tick, totalSupply, limitPerMint, nonce)
      // await Util.sendTransaction(walletSender, txData, false);
      if ((i % 200 == 0) || (i == totalTxCount - 1)) {
        await prepareSignedTransaction(walletSender, txData);
      } else {
        prepareSignedTransaction(walletSender, txData);
      }

      if (count > 1) nonce++;
    }
    catch (e) {
      console.warn('Error:', e)
    }
  }

  await waitForSignTx();

  let signedTransactions = Object.keys(signedTxlist)
  let totalSignedTx = signedTransactions.length;
  for (let i = 0; i < totalSignedTx; i++) {
    console.log(moment(new Date().getTime()).format('HH:mm:ss.SSS') + "  Count:", i + 1, ' / ', totalSignedTx)
    try {
      // TODO: The transaction cannot be sent too fast, otherwise an error will be reported (reason: getaddrinfo ENOTFOUND)
      if ((i != 0) && ((i % 10 == 0) || (i == totalSignedTx - 1))) {
        await Util.sendSignedTransaction(walletSender, signedTxlist[signedTransactions[i]]);
        await Util.sleep(15000)
      } else {
        await Util.sendSignedTransaction(walletSender, signedTxlist[signedTransactions[i]], false);
      }
    }
    catch (e) {
      console.warn('Error:', e)
    }
  }
}


async function mintTick(tick, count, mintCount = 1, multiAccount = true) {
  let privateKeyList = [];
  let walletSender = null;
  let nonce = null;
  if (multiAccount) {
    var accounts = require('./accounts.json');
    privateKeyList = Object.values(accounts.accounts);
    if (mintCount > privateKeyList.length) {
      console.warn('The maximum mint count is', privateKeyList.length)
      return;
    }
  } else {
    let config = require('./config.json');
    walletSender = await Util.getWalletAccount(config.privatekey)
    nonce = await Util.getTransactionCount(walletSender.address)
    console.log('nonce:', nonce)
  }

  let startIndex = 0;
  totalTxCount = mintCount;
  for (let i = startIndex; i < mintCount + startIndex; i++) {
    if (multiAccount) {
      walletSender = await Util.getWalletAccount(privateKeyList[i])
    }
    console.log(moment(new Date().getTime()).format('HH:mm:ss.SSS') + " ", ' Count:', i - startIndex + 1, ' / ', mintCount, walletSender.address)
    try {
      const txData = Util.getMintTokenData(walletSender.address, tick, count, nonce)
      //   await Util.sendTransaction(walletSender, txData, false);
      if ((i % 200 == 0) || (i == totalTxCount - 1)) {
        await prepareSignedTransaction(walletSender, txData);
      } else {
        prepareSignedTransaction(walletSender, txData);
      }

      if (!multiAccount) nonce++;
    }
    catch (e) {
      console.warn('Error:', e)
    }
  }

  await waitForSignTx();

  let signedTransactions = Object.keys(signedTxlist)
  let totalSignedTx = signedTransactions.length;

  for (let i = 0; i < totalSignedTx; i++) {
    console.log(moment(new Date().getTime()).format('HH:mm:ss.SSS') + "  Count:", i + 1, ' / ', totalSignedTx)

    if (multiAccount) {
      walletSender = await Util.getWalletAccount(accounts.accounts[signedTransactions[i]])
    }
    try {
      // TODO: The transaction cannot be sent too fast, otherwise an error will be reported (reason: getaddrinfo ENOTFOUND)
      if ((i != 0) && ((i % 10 == 0) || (i == totalSignedTx - 1))) {
        await Util.sendSignedTransaction(walletSender, signedTxlist[signedTransactions[i]]);
        await Util.sleep(15000)
      } else {
        await Util.sendSignedTransaction(walletSender, signedTxlist[signedTransactions[i]], false);
      }
    }
    catch (e) {
      console.warn('Error:', e)
    }
  }
}

async function mintTicks(tickPre, count, mintCount = 1, multiAccount = true) {
  let privateKeyList = [];
  let walletSender = null;
  let nonce = null;
  if (multiAccount) {
    var accounts = require('./accounts.json');
    privateKeyList = Object.values(accounts.accounts);
    if (mintCount > privateKeyList.length) {
      console.warn('The maximum mint count is', privateKeyList.length)
      return;
    }
  } else {
    let config = require('./config.json');
    walletSender = await Util.getWalletAccount(config.privatekey)
    nonce = await Util.getTransactionCount(walletSender.address)
    console.log('nonce:', nonce)
  }

  let startIndex = 0;
  totalTxCount = mintCount;
  for (let i = startIndex; i < mintCount + startIndex; i++) {
    let tick = tickPre;
    if (mintCount > 1) {
      tick = tickPre + '-' + i.toString().padStart(4, '0');
    }

    if (multiAccount) {
      walletSender = await Util.getWalletAccount(privateKeyList[i])
    }
    console.log(moment(new Date().getTime()).format('HH:mm:ss.SSS') + " ", ' Count:', i - startIndex + 1, ' / ', mintCount, walletSender.address)
    try {
      const txData = Util.getMintTokenData(walletSender.address, tick, count, nonce)
      //   await Util.sendTransaction(walletSender, txData, false);
      if ((i % 200 == 0) || (i == totalTxCount - 1)) {
        await prepareSignedTransaction(walletSender, txData);
      } else {
        prepareSignedTransaction(walletSender, txData);
      }

      if (!multiAccount) nonce++;
    }
    catch (e) {
      console.warn('Error:', e)
    }
  }

  await waitForSignTx();

  let signedTransactions = Object.keys(signedTxlist)
  let totalSignedTx = signedTransactions.length;

  for (let i = 0; i < totalSignedTx; i++) {
    console.log(moment(new Date().getTime()).format('HH:mm:ss.SSS') + "  Count:", i + 1, ' / ', totalSignedTx)

    if (multiAccount) {
      walletSender = await Util.getWalletAccount(accounts.accounts[signedTransactions[i]])
    }
    try {
      // TODO: The transaction cannot be sent too fast, otherwise an error will be reported (reason: getaddrinfo ENOTFOUND)
      if ((i != 0) && ((i % 5 == 0) || (i == totalSignedTx - 1))) {
        await Util.sendSignedTransaction(walletSender, signedTxlist[signedTransactions[i]]);
        await Util.sleep(15000)
      } else {
        await Util.sendSignedTransaction(walletSender, signedTxlist[signedTransactions[i]], false);
      }
    }
    catch (e) {
      console.warn('Error:', e)
    }
  }
}


async function transferTick(toAddress, tick, count, transferCount = 1, multiAccount = false) {
  let privateKeyList = [];
  let walletSender = null;
  let nonce = null;
  if (multiAccount) {
    // TODO
    var accounts = require('./accounts.json');
    privateKeyList = Object.values(accounts.accounts);
    if (transerCount > privateKeyList.length) {
      console.warn('The maximum mint count is', privateKeyList.length)
      return;
    }
  } else {
    let config = require('./config.json');
    walletSender = await Util.getWalletAccount(config.privatekey)
    nonce = await Util.getTransactionCount(walletSender.address)
    console.log('nonce:', nonce)
  }

  let startIndex = 0;
  totalTxCount = transferCount;
  for (let i = startIndex; i < transferCount + startIndex; i++) {
    if (multiAccount) {
      walletSender = await Util.getWalletAccount(privateKeyList[i])
    }
    console.log(moment(new Date().getTime()).format('HH:mm:ss.SSS') + " ", ' Count:', i - startIndex + 1, ' / ', transferCount, walletSender.address)
    try {
      const txData = Util.getTransferTokenData(walletSender.address, toAddress, tick, count, nonce)
      //   await Util.sendTransaction(walletSender, txData, false);
      if ((i % 200 == 0) || (i == totalTxCount - 1)) {
        await prepareSignedTransaction(walletSender, txData);
      } else {
        prepareSignedTransaction(walletSender, txData);
      }

      if (!multiAccount) nonce++;
    }
    catch (e) {
      console.warn('Error:', e)
    }
  }

  await waitForSignTx();

  let signedTransactions = Object.keys(signedTxlist)
  let totalSignedTx = signedTransactions.length;

  for (let i = 0; i < totalSignedTx; i++) {
    console.log(moment(new Date().getTime()).format('HH:mm:ss.SSS') + "  Count:", i + 1, ' / ', totalSignedTx)

    if (multiAccount) {
      walletSender = await Util.getWalletAccount(accounts.accounts[signedTransactions[i]])
    }
    try {
      // TODO: The transaction cannot be sent too fast, otherwise an error will be reported (reason: getaddrinfo ENOTFOUND)
      if ((i != 0) && ((i % 5 == 0) || (i == totalSignedTx - 1))) {
        await Util.sendSignedTransaction(walletSender, signedTxlist[signedTransactions[i]]);
        await Util.sleep(15000)
      } else {
        await Util.sendSignedTransaction(walletSender, signedTxlist[signedTransactions[i]], false);
      }
    }
    catch (e) {
      console.warn('Error:', e)
    }
  }
}

//
async function transferTicks(toAddress, tickPre, count, transferCount = 1, multiAccount = true) {
  let privateKeyList = [];
  let walletSender = null;
  let nonce = null;
  if (multiAccount) {
    var accounts = require('./accounts.json');
    privateKeyList = Object.values(accounts.accounts);
    if (transferCount > privateKeyList.length) {
      console.warn('The maximum mint count is', privateKeyList.length)
      return;
    }
  } else {
    let config = require('./config.json');
    walletSender = await Util.getWalletAccount(config.privatekey)
    nonce = await Util.getTransactionCount(walletSender.address)
    console.log('nonce:', nonce)
  }

  let startIndex = 0;
  totalTxCount = transferCount;
  for (let i = startIndex; i < transferCount + startIndex; i++) {
    let tick = tickPre;
    if (transferCount > 1) {
      tick = tickPre + '-' + i.toString().padStart(4, '0');
    }

    if (multiAccount) {
      walletSender = await Util.getWalletAccount(privateKeyList[i])
    }
    console.log(moment(new Date().getTime()).format('HH:mm:ss.SSS') + " ", ' Count:', i - startIndex + 1, ' / ', transferCount, walletSender.address)
    try {
      const txData = Util.getTransferTokenData(walletSender.address, toAddress, tick, count, nonce)
      //   await Util.sendTransaction(walletSender, txData, false);
      if ((i % 200 == 0) || (i == totalTxCount - 1)) {
        await prepareSignedTransaction(walletSender, txData);
      } else {
        prepareSignedTransaction(walletSender, txData);
      }

      if (!multiAccount) nonce++;
    }
    catch (e) {
      console.warn('Error:', e)
    }
  }

  await waitForSignTx();

  let signedTransactions = Object.keys(signedTxlist)
  let totalSignedTx = signedTransactions.length;

  for (let i = 0; i < totalSignedTx; i++) {
    console.log(moment(new Date().getTime()).format('HH:mm:ss.SSS') + "  Count:", i + 1, ' / ', totalSignedTx)

    if (multiAccount) {
      walletSender = await Util.getWalletAccount(accounts.accounts[signedTransactions[i]])
    }
    try {
      // TODO: The transaction cannot be sent too fast, otherwise an error will be reported (reason: getaddrinfo ENOTFOUND)
      if ((i != 0) && ((i % 5 == 0) || (i == totalSignedTx - 1))) {
        await Util.sendSignedTransaction(walletSender, signedTxlist[signedTransactions[i]]);
        await Util.sleep(15000)
      } else {
        await Util.sendSignedTransaction(walletSender, signedTxlist[signedTransactions[i]], false);
      }
    }
    catch (e) {
      console.warn('Error:', e)
    }
  }
}
void (async () => {
  // await deployTick('T001', 21000000000, 1000, 1)
  // await deployTick('T002', 21000000000, 1000, 1)
  // await deployTick('T003', 21000000000, 1000, 1)
  // await deployTick('T004', 21000000000, 1000, 1)

  await deployTick('test', 21000000000, 1000, 1)

  // await deployTick('TTONE', 21000000, 10000, 1)
  // await mintTick('11901-0001', 21000000, 1, false)

  // await deployTick('11901', 21000000, 10000, 50)
  // await mintTick('11901-0001', 10000, 1, false)
  // await mintTicks('11901', 10000, 100, true)

  // await deployTick('esctest15', 150000, 10000, 1)
  // await mintTick('esctest15', 10000, 20, false)

  // await deployTick('esctest100', 1000000, 10000, 1)
  // await mintTick('esctest100', 10000, 100, true)

  // await deployTick('esctest-2', 21000000, 2000000, 1)
  // await mintTick('esctest-2', 2000000, 15, true)

  // await deployTick('esctest-1500', 15000000, 10000, 1)
  // await mintTick('esctest-1500', 10000, 30, false)

  // await deployTick('esctest', 21000000, 10000, 100)

  // await deployTick('esctestONE', 21000000, 21000000, 40)
  // await mintTicks('esctestONE', 21000000, 44, false)

  // await deployTick('esctest', 21000000, 10000, 100)
  // await mintTick('esctest100', 10000, 100, true)

  // await mintTicks('esctest', 10000, 100, false)

  // await deployTick('esctest2100', 21000000, 1000, 1)
  // await deployTick('test-1000-OneMint', 1000, 1000, 1)
  // await deployTick('esc-2024', 21000000000, 21000000, 1)
  // await mintTick('esctest-1000-OneMint', 1000, 1, false)
  // await mintTick('test-1000-OneMint', 1000, 2, false)

  // await transferTick('0x76DC32362ecdC461ec913fe3931793FeC998C6F8', 'esctest15', 1000, 50, false)
  // await transferTicks('0x76DC32362ecdC461ec913fe3931793FeC998C6F8', 'esctest', 10000, 10, false)
  // process.exit(0);
})();