
const moment = require("moment");
const Util = require("./util.js")
const HttpHelper = require("./httphelper.js")

async function transferAllTicksTo(wallet, toAddress) {
  let nonce = await Util.getTransactionCount(wallet.address)
  console.log('nonce:', nonce)

  let tokensData = await HttpHelper.getTokenListByAddress(wallet.address, 0)
  console.log('Total:', tokensData.total)


  for (let i = 0; i < tokensData.list.length; i++) {
    console.log("Token:", tokensData.list[i]);
    // console.log(moment(new Date().getTime()).format('HH:mm:ss.SSS') + " ", ' Count:', i - startIndex + 1, ' / ', transferCount, walletSender.address)
    try {
      const txData = Util.getTransferTokenData(wallet.address, toAddress, tokensData.list[i].tick, tokensData.list[i].amount, nonce)
      await Util.sendTransaction(wallet, txData, false);
      nonce++;
    }
    catch (e) {
      console.warn('Error:', e)
    }
  }
}

void (async () => {
  let privateKey = '0x9fd0145a5e426bede4ffe7dc7d6f51e5680478f74243105467c2353430362b9b';
  let wallet = await Util.getWalletAccount(privateKey)

  await transferAllTicksTo(wallet, '0x59e2A9d3a4F492c6277Fe18b5CD6bf84E339eE33')

  // process.exit(0);
})();