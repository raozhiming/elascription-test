
const moment = require("moment");
const { Web3 } = require("web3");
let config = require('./config.json');
let web3 = new Web3(config.rpc);

module.exports = {
  sleep: function sleep(ms) {
    return new Promise((resolve) => {
        console.log('sleep', ms, 'ms')
        setTimeout(() => {
            resolve();
        }, ms);
    })
  },

  getBalance: async function getBalance(address) {
    const balanceWei = await web3.eth.getBalance(address)
    const balance = web3.utils.fromWei(balanceWei, 'ether')
    console.log('The balance:', address, balance)
    return balance
  },

  getBlockNumber: async function getBlockNumber(address) {
    return await web3.eth.getBlockNumber()
  },

  getPendingTransactions: async function getPendingTransactions(address) {
    const pendingTxs = await web3.eth.getPendingTransactions(address)
    return pendingTxs;
  },

  getTransactionCount: async function getTransactionCount(address) {
    const txCount = await web3.eth.getTransactionCount(address)

    const pendingTxs = await web3.eth.getPendingTransactions(address)
    console.log('pendingTxs:', pendingTxs)

    console.log('getBlockNumber:', await web3.eth.getBlockNumber())
    const txCount2 = await web3.eth.getTransactionCount(address, "pending")
    console.log('pending Tx Count:', txCount2)
    return txCount;
  },

  getWalletAccount: async function getWalletAccount(privateKey) {
    const wallet = await web3.eth.accounts.privateKeyToAccount(privateKey);
    return wallet
  },

  /**
   *
   * @param {*} fromAddress
   * @param {*} toAddress
   * @param {*} amount : ela
   * @returns
   */
  getTransferNativeTokenData: function getTransferNativeTokenData(fromAddress, toAddress, amount, nonce) {
    let txData = {
      from: fromAddress,
      to: toAddress,
      gasLimit: "2000000",
      gasPrice: "1000000000",
      value: web3.utils.toWei(amount, 'ether'),
      nonce: nonce
    }

    return txData;
  },

  getDeployTokenData: function getDeployTokenData(address, tick, totalSupply, limitPerMint, nonce = null) {
    const data = `data:,{"p":"esc-20","op":"deploy","tick":"${tick}","max":"${totalSupply}","lim":"${limitPerMint}"}`;

    let txData = {
      from: address,
      to: address,
      gasLimit: "100000",
      gasPrice: "1000000000",
      value: "0",
      data: Web3.utils.stringToHex(data)
    }

    if (nonce) {
      txData['nonce'] = nonce;
    }

    return txData;
  },

  getMintTokenData: function getMintTokenData(address, tick, amount, nonce = null) {
    const data = `data:,{"p":"esc-20","op":"mint","tick":"${tick}","amt":"${amount}"}`;

    let txData = {
      from: address,
      to: address,
      gasLimit: "100000",
      gasPrice: "1000000000",
      value: "0",
      data: Web3.utils.stringToHex(data),
    }

    if (nonce) {
      txData['nonce'] = nonce;
    }
    return txData;
  },

  getTransferTokenData: function getTransferTokenData(fromAddress, toAddress, tick, amount, nonce) {
    const data = `data:,{"p":"esc-20","op":"transfer","tick":"${tick}","amt":"${amount}"}`;

    let txData = {
      from: fromAddress,
      to: toAddress,
      gasLimit: "100000",
      gasPrice: "1000000000",
      value: "0",
      data: Web3.utils.stringToHex(data),
    }

    if (nonce) {
      txData['nonce'] = nonce;
    }
    return txData;
  },

  signTransaction: async function signTransaction(walletAccount, txData) {
    return new Promise(async (resolve, reject) => {
        try {
          let tx = await walletAccount.signTransaction(txData)
          return resolve(tx.rawTransaction);
        } catch (e) {
          console.log('signTransaction exception:', e)
          return reject()
        }
    });
  },

  sendSignedTransaction: async function sendSignedTransaction(walletAccount, rawTransaction, waitForConfirm = true) {
    return new Promise(async (resolve, reject) => {
        try {
          console.log(moment(new Date().getTime()).format('HH:mm:ss.SSS') + " " + "start sendSignedTransaction")

          web3.eth.sendSignedTransaction(rawTransaction)
          // .once('transactionHash', function(hash){ console.log("txHash", hash); return resolve()})
          .once('confirmation', function(confNumber, receipt) {
            console.log(moment(new Date().getTime()).format('HH:mm:ss.SSS') + "tx confirmed block:", confNumber.receipt.blockNumber)
            return resolve()
          })
          .on('error', function(error) {
            console.log("sendSignedTransaction error", error)
            return reject()
          })
          // .then(function(receipt){
          //     console.log("trasaction mined!", receipt);
          // });
          if (!waitForConfirm) return resolve();
        } catch (e) {
          console.log('sendSignedTransaction exception:', e)
          return reject()
        }
    });
  },

  sendTransaction: async function sendTransaction(walletAccount, txData, waitForConfirm = true) {
    return new Promise(async (resolve, reject) => {
        try {
          console.log(moment(new Date().getTime()).format('HH:mm:ss.SSS') + " " + "start signTransaction")
          walletAccount.signTransaction(txData).then((tx) => {
            console.log(moment(new Date().getTime()).format('HH:mm:ss.SSS') + " " + "start sendSignedTransaction")

            web3.eth.sendSignedTransaction(tx.rawTransaction)
            .once('confirmation', function(confNumber, receipt) {
              console.log(moment(new Date().getTime()).format('HH:mm:ss.SSS') + " tx confirmed block:", confNumber.receipt.blockNumber)
              return resolve()
            })
            .on('error', function(error) {
              console.log("sendSignedTransaction error", error)
              return reject()
            })

            return resolve();
          })

          if (!waitForConfirm) return resolve();
        } catch (e) {
          console.log('sendTransaction exception:', e)
          return reject()
        }
    });
  }
}
