const axios = require("axios");
let config = require('./config.json');

// export type TokenList = {
//   list: any[],
//   total: number
// }

module.exports = {
  get: async function get(url) {
    try {
      let res = await axios.get(url);
      return res.data?.data;
    } catch (e) {
      console.warn("axios.get error:", e);
      return undefined;
    }
  },

  post: async function post(url, params) {
    try {
      let res = await axios.post(url, params);
      return res.data?.data;
    } catch (e) {
      console.warn("axios.post error:", e);
      return undefined;
    }
  },

  getTokenListByAddress: async function getTokenListByAddress(address, page = 0) {
    try {
      let apiUrl = config.apiurl + '/esc20/tokens';
      let param = {
        "page": page,
        "limit": 50,
        "owner": address,
      }
      let res = await axios.post(apiUrl, param);
      return res.data?.data;
    } catch (e) {
      console.warn("axios.post error:", e);
      return undefined;
    }
  },

}
