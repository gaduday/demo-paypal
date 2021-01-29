const express = require('express');
const router = express.Router();
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();
const { v1: uuidv1 } = require('uuid');
const queryString = require('qs');
const sha256 = require('sha256');
const dateFormat = require('dateformat');

let today = new Date();
let date =
  today.getFullYear() +
  '-' +
  (today.getMonth() + 1) +
  '-' +
  today.getDate() +
  '/' +
  today.getHours() +
  ':' +
  today.getMinutes() +
  ':' +
  today.getSeconds();

router.post('/pay', (req, res, next) => {
  let ipAddr =
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  let tmnCode = process.env.TMN_CODE;
  let secretKey = process.env.HASH_SECRET;
  let vnpUrl = 'http://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  let returnUrl = 'http://localhost:3000/vnpay/vnpay_return';
  // let createDate = date;
  let newDate = new Date(); //
  let createDate = dateFormat(newDate, 'yyyymmddHHmmss'); //
  let orderId = uuidv1();

  let amount = req.body.money;
  let orderInfo = req.body.reason;
  let orderType = 'billpayment';
  let currCode = 'VND';

  let vnp_Params = {};
  vnp_Params['vnp_Version'] = '2';
  vnp_Params['vnp_Command'] = 'pay';
  vnp_Params['vnp_TmnCode'] = tmnCode;
  vnp_Params['vnp_Locale'] = 'vn';
  vnp_Params['vnp_CurrCode'] = currCode;
  vnp_Params['vnp_TxnRef'] = orderId;
  vnp_Params['vnp_OrderInfo'] = orderInfo;
  vnp_Params['vnp_OrderType'] = orderType;
  vnp_Params['vnp_Amount'] = amount * 100 * 23000;
  vnp_Params['vnp_ReturnUrl'] = returnUrl;
  vnp_Params['vnp_IpAddr'] = ipAddr;
  vnp_Params['vnp_CreateDate'] = createDate;
  vnp_Params['vnp_BankCode'] = 'VNPAYQR';

  vnp_Params = sortObject(vnp_Params);
  // console.log(vnp_Params);

  let signData =
    secretKey + queryString.stringify(vnp_Params, { encode: false });

  let secureHash = sha256(signData);

  vnp_Params['vnp_SecureHashType'] = 'SHA256';
  vnp_Params['vnp_SecureHash'] = secureHash;
  vnpUrl += '?' + queryString.stringify(vnp_Params, { encode: true });

  res.status(200).json({ code: '200', payUrl: vnpUrl });
});

router.get('/vnpay_return', function (req, res, next) {
  // console.log('return:', req.query);
  let vnp_Params = req.query;

  let secureHash = vnp_Params['vnp_SecureHash'];

  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  vnp_Params = sortObject(vnp_Params);

  let tmnCode = process.env.TMN_CODE;
  let secretKey = process.env.HASH_SECRET;

  let signData =
    secretKey + queryString.stringify(vnp_Params, { encode: false });

  let checkSum = sha256(signData);

  if (secureHash === checkSum) {
    if (vnp_Params['vnp_ResponseCode'] == '00') {
      res.redirect('/success.html');
    } else {
      res.redirect('/err.html');
    }
  } else {
    res.redirect('/err.html');
  }
});

router.get('/vnpay_ipn', function (req, res, next) {
  let vnp_Params = req.query;
  let secureHash = vnp_Params['vnp_SecureHash'];

  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  vnp_Params = sortObject(vnp_Params);
  let secretKey = process.env.HASH_SECRET;
  
  let signData =
    secretKey + queryString.stringify(vnp_Params, { encode: false });

  let checkSum = sha256(signData);

  if (secureHash === checkSum) {
    let orderId = vnp_Params['vnp_TxnRef'];
    let rspCode = vnp_Params['vnp_ResponseCode'];
    //Kiem tra du lieu co hop le khong, cap nhat trang thai don hang va gui ket qua cho VNPAY theo dinh dang duoi
    res.status(200).json({ RspCode: '00', Message: 'success' });
  } else {
    res.status(200).json({ RspCode: '97', Message: 'Fail checksum' });
    res.redirect('/err.html');
  }
});

const sortObject = (o) => {
  let sorted = {},
    key,
    a = [];

  for (key in o) {
    if (o.hasOwnProperty(key)) {
      a.push(key);
    }
  }

  a.sort();

  for (key = 0; key < a.length; key++) {
    sorted[a[key]] = o[a[key]];
  }
  return sorted;
};

module.exports = router;