
const moment = require("moment");
const Util = require("./util.js")
const { BehaviorSubject }  = require('rxjs');

const { Web3 } = require("web3");
let config = require('./config.json');
let web3 = new Web3(config.rpc);

let signedTxlist = {}
let signedTxCount = 0;
let totalTxCount = 0;
let totalConfirmedTxCount = 0;
let addressListNeedMoreELA = {}
let addressTotalCount = 0, addressCheckedCount = 0;
let checkBalanceStatus = new BehaviorSubject(0);
let signTxStatus = new BehaviorSubject(0);

async function checkAddressBalance(address, minBalance) {
  const balance = await Util.getBalance(address)
  let balanceNumber = parseFloat(balance)
  if (balanceNumber < minBalance) {
    console.warn('the balance is not enough:', address, balanceNumber)
    addressListNeedMoreELA[address] = balanceNumber;
  }
  addressCheckedCount++;
  console.log('addressCheckedCount', addressCheckedCount, '/', addressTotalCount)
  if (addressCheckedCount >= addressTotalCount) {
    console.warn('address list need more ELA:', Object.keys(addressListNeedMoreELA).length, addressListNeedMoreELA)
     checkBalanceStatus.next(addressCheckedCount)
  }
  return balance
}

async function waitForCheckBalance() {
  return new Promise(async (resolve, reject) => {
    checkBalanceStatus.subscribe( (count)=> {
      if (count > 0) {
        resolve();
      }
    })
  });
}

async function checkWalletBalance(addressList, minBalance) {
  addressListNeedMoreELA = [] // reset
  let startIndex = 1000;
  addressTotalCount = addressList.length - startIndex;
  // addressTotalCount = 100;
  for (let i = startIndex; i < addressList.length; i++) {
    try {
      console.log('check wallet balance', i, '/', addressList.length)
      // TODO: In order to get the balance faster.
      if ((i != 0) && ((i % 200 == 0) || (i == addressList.length - 1))) {
        await checkAddressBalance(addressList[i], minBalance);
        await Util.sleep(1000)
      } else {
        checkAddressBalance(addressList[i], minBalance);
      }
    }
    catch (e) {
      console.warn('Error:', e)
    }
  }
}

async function prepareSignedTransaction(walletAccount, txData) {
  let signedTransaction = '';
  try {
    signedTransaction = await Util.signTransaction(walletAccount, txData);
  } catch (e) {
    signedTransaction = await Util.signTransaction(walletAccount, txData);
  }
  // if no txData.nonce?
  signedTxlist[txData.nonce] = signedTransaction;

  signedTxCount++;
  if (signedTxCount >= totalTxCount) {
    console.warn('signed tx list:', Object.keys(signedTxlist).length, signedTxlist)
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

/**
 *
 * @param {*} addressList
 * @param {*} amount : ela
 */
// TODO: 这种方式方式交易速度块，一个块可以有多个交易，但容易出错，不确定是网络还是服务器问题
async function sendELAToTestAccount(addressList, amount) {
  let startIndex = 0;
  let total = addressList.length;
  // total = 1100; // Test

  let config = require('./config.json');
  let walletSender = await Util.getWalletAccount(config.privatekey)

  let balance = await Util.getBalance(walletSender.address)
  console.log('Sender balance:', walletSender.address, balance)

  let txCount = await Util.getTransactionCount(walletSender.address)
  console.log('txCount:', txCount)

  totalTxCount = total - startIndex;
  for (let i = startIndex; i < total; i++) {
    console.log(moment(new Date().getTime()).format('HH:mm:ss.SSS') + " ", 'To Address:', addressList[i], ' Count:', i, ' / ', total)
    try {
      const txData = Util.getTransferNativeTokenData(walletSender.address, addressList[i], amount, txCount++)
      if ((i % 200 == 0) || (i == total - 1)) {
        await prepareSignedTransaction(walletSender, txData);
      } else {
        prepareSignedTransaction(walletSender, txData);
      }
    }
    catch (e) {
      console.warn('Error:', e)
    }
  }

  await waitForSignTx();

  let signedTransactions = Object.values(signedTxlist)
  let totalSignedTx = signedTransactions.length;
  for (let i = 0; i < totalSignedTx; i++) {
    console.log(moment(new Date().getTime()).format('HH:mm:ss.SSS') + "  Count:", i, ' / ', totalSignedTx)
    try {
      // TODO: The transaction cannot be sent too fast, otherwise an error will be reported (reason: getaddrinfo ENOTFOUND)
      if ((i != 0) && ((i % 10 == 0) || (i == totalSignedTx - 1))) {
        await Util.sendSignedTransaction(walletSender, signedTransactions[i]);
        await Util.sleep(10000)
      } else {
        await Util.sendSignedTransaction(walletSender, signedTransactions[i], false);
      }
    }
    catch (e) {
      console.warn('Error:', e)
    }
  }

  await Util.sleep(1000)

  let balanceEnd = await Util.getBalance(walletSender.address)
  console.log('The balance of sender wallet:', balanceEnd)
}


/**
 *
 * @param {*} addressList
 * @param {*} amount : ela
 */
async function sendELAToTestAccount2(addressList, amount) {
  let startIndex = 0;
  let total = addressList.length;
  total = 100; // Test

  let config = require('./config.json');
  let walletSender = await Util.getWalletAccount(config.privatekey)

  let balance = await Util.getBalance(walletSender.address)
  console.log('Sender balance:', walletSender.address, balance)

  let txCount = await Util.getTransactionCount(walletSender.address)
  console.log('Transaction Count:', txCount)

  totalTxCount = total - startIndex;
  for (let i = startIndex; i < total; i++) {
    console.log(moment(new Date().getTime()).format('HH:mm:ss.SSS') + " ", 'To Address:', addressList[i], ' Count:', i, ' / ', total)
    try {
      const txData = Util.getTransferNativeTokenData(walletSender.address, addressList[i], amount, txCount++)
      await Util.sendTransaction(walletSender, txData, false);
    }
    catch (e) {
      console.warn('Error:', e)
    }
  }

  let balanceEnd = await Util.getBalance(walletSender.address)
  console.log('The balance of sender wallet:', balanceEnd)
}

void (async () => {
  var accounts = require('./accounts.json');
  let allTestAddressList = Object.keys(accounts.accounts);
  // await sendELAToTestAccount(allTestAddressList, 0.0001)

  await checkWalletBalance(allTestAddressList, 0.0001)

  await waitForCheckBalance();

  let addressList = Object.keys(addressListNeedMoreELA)
  console.log('addressList:', addressList)
  // if (addressList.length >= 1) {
  //   await sendELAToTestAccount(addressList, 0.0001)
  // }
  // else {
  //   console.log("All addresses have enough balance!")
  // }
  // process.exit(0);
// let config = require('./config.json');
// let walletSender = await Util.getWalletAccount(config.privatekey)


// web3.eth.getTransactionCount(walletSender.address).then((nonce)=>{
//   console.log("nonce", nonce)
//   transfer(walletSender, nonce)
// })
})();




function transfer(walletSender, nonce) {
  var accounts = require('./accounts.json');
  let nodesAddress = Object.keys(accounts.accounts);

  var i = 0;
  for(i = 0; i < nodesAddress.length; i++) {
      console.log("transeer", nodesAddress[i])
      tx = {to: nodesAddress[i], from: walletSender.address, gas: 22000, gasPrice: "1000000000", nonce: nonce++,value:web3.utils.toWei("10", 'wei')}

      walletSender.signTransaction(tx).then((stx) => {
          web3.eth.sendSignedTransaction(stx.rawTransaction)
          .on("transactionHash", (r) => console.log(r))
          .then((e) => console.log('--then'))
          .catch((e) => console.log('---sendSignedTransaction excepton', e));
      })
      .catch((e) => console.log('---signTransaction excepton', e));
  }
}