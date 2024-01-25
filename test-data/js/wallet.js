
const { ethers } = require('ethers');
const fs = require("fs");

const evmPaths = ["m/44'/60'/x'/0/0", "m/44'/60'/0'/0/x'"];

function createAccount() {
  let mnemonicObj = null;
  let config = require('./config.json');
  if (config.mnemonic) {
    mnemonicObj = ethers.Mnemonic.fromPhrase(mnemonic);
    console.log('mnemonic:', mnemonicObj.phrase)
  } else {
    mnemonicObj = ethers.Mnemonic.fromEntropy(ethers.randomBytes(16))
  }

  let accounts = { mnemonic : mnemonicObj.phrase,
                   accounts: {}
                  }
  let addressCount = 1500;
  for (let i = 0; i < 1500; i++) {
    if (i % 100 == 0) console.log('Create Address:', i)
    const path = evmPaths[0].replace("x", String(i));
    const wallet = ethers.HDNodeWallet.fromMnemonic(mnemonicObj, path);
    accounts.accounts[wallet.address] = wallet.privateKey;
  }

  console.log('Number of new addresses:', addressCount)

  fs.writeFile(
    './accounts.json',

    JSON.stringify(accounts, null, 2),

    function (err) {
        if (err) {
            console.error('error', err);
        }
    }
  );
}

function prepareData() {
  if (fs.existsSync('./accounts.json')) {
    var accounts = require('./accounts.json');
    console.log('accounts:', accounts)
  } else {
    console.log('create new account')
    createAccount()
  }
}

prepareData()

