
const moment = require("moment");
const Util = require("./util.js")

void (async () => {
  var brc20tokenlist = require('./brc20tokenlist.json');
  console.log('Brc20 Token count:', brc20tokenlist.length);

  let config = require('./config.json');
  wallet = await Util.getWalletAccount(config.privatekey)
  nonce = await Util.getTransactionCount(wallet.address)
  console.log('nonce:', nonce)

  for (let i = 0; i < brc20tokenlist.length; i++) {
    console.log('Deploy ', i, ' / ', brc20tokenlist.length)
    // const txData = Util.getDeployTokenData(wallet.address, brc20tokenlist[i].token, brc20tokenlist[i].totalSupply, brc20tokenlist[i].totalSupply, nonce)
    const txData = Util.getDeployTokenData(wallet.address, 'test', brc20tokenlist[i].totalSupply, brc20tokenlist[i].totalSupply, nonce)
    await Util.sendTransaction(wallet, txData, true);
    nonce++;

    // if (( i != 0 && (i % 10 == 0)) || (i == brc20tokenlist.length - 1)) {
    //   await Util.sleep(15000)
    // }
  }

  // for (let i = 0; i < brc20tokenlist.length; i++) {
  //   const txData = Util.getMintTokenData(wallet.address, brc20tokenlist[i].token, brc20tokenlist[i].totalSupply, nonce)
  //   await Util.sendTransaction(walletSender, txData, false);
  //   nonce++;
  // }

})();