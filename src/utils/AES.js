import crypto from 'crypto-js';

// 从环境变量读取AES密钥
const pk_secret = process.env.AES_SECRET || "3a4b3ca0247e0500da70d637f6c5ded8"

const AES = {
  // 加密
  passwd_encode(de_pass_str){
    let cryptoInfo = crypto.AES.encrypt(JSON.stringify(de_pass_str), pk_secret);

    // console.log("加密===",cryptoInfo.toString());
    return cryptoInfo.toString()
  },

  // 解密
  passwd_decode(en_pass_str){
    let info2 = crypto.AES.decrypt(en_pass_str.toString(), pk_secret).toString(crypto.enc.Utf8);

    // console.log("解密====",JSON.parse(info2));
    return JSON.parse(info2)
  },
}

export default AES;
