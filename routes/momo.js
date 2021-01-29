const express = require('express');
const router = express.Router();
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();
const { v1: uuidv1 } = require('uuid');
const crypto = require('crypto');
const request = require('request');

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
  let endpoint = 'https://test-payment.momo.vn/gw_payment/transactionProcessor';
  // let hostname = 'https://test-payment.momo.vn';
  // let path = '/gw_payment/transactionProcessor';
  let partnerCode = process.env.PARTNER_CODE;
  let accessKey = process.env.ACCESS_KEY;
  let secretKey = process.env.SECRET_KEY;
  // let partnerCode = 'MOMOG1DU20201224';
  // let accessKey = '0Qx3J4zHtubPGuMz';
  // let secretKey = '31b9nvtNZxvQmoMu204WPYVpoWkxKxKt';
  let orderInfo = req.body.reason;
  let orderId = uuidv1();
  let requestId = uuidv1();
  let returnUrl = `http://localhost:3000/momo/return_momo/${orderId}`;
  let notifyUrl = 'https://api.mt.gialai.dulieutnmt.vn:8989/';
  let amount = (req.body.money * 23000).toString();
  let requestType = 'captureMoMoWallet';
  let extraData = 'merchantName=;merchantId=';

  let rawSignature =
    'partnerCode=' +
    partnerCode +
    '&accessKey=' +
    accessKey +
    '&requestId=' +
    requestId +
    '&amount=' +
    amount +
    '&orderId=' +
    orderId +
    '&orderInfo=' +
    orderInfo +
    '&returnUrl=' +
    returnUrl +
    '&notifyUrl=' +
    notifyUrl +
    '&extraData=' +
    extraData;

  // console.log(rawSignature)

  let signature = crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');

  let body = JSON.stringify({
    partnerCode,
    accessKey,
    requestId,
    amount,
    orderId,
    orderInfo,
    returnUrl,
    notifyUrl,
    extraData,
    requestType,
    signature,
  });

  const paymentInfo = {
    orderId,
    paymentId: '',
    payerId: '',
    status: 'created',
    money: amount,
    reason: orderInfo,
    name: req.body.name,
    phone: req.body.phone,
    email: req.body.email,
    date,
  };

  fs.readFile('db/db.json', (err, data) => {
    if (err) {
      console.log(err);
    } else {
      if (!JSON.parse(data)) {
        console.log('db error');
      } else {
        let parsedData = JSON.parse(data);
        parsedData.push(paymentInfo);

        fs.writeFile(
          'db/db.json',
          JSON.stringify(parsedData, null, 2),
          (err) => {
            if (err) throw err;
            console.log('created');
          }
        );
      }
    }
  });

  request(
    {
      url: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      hostname: 'test-payment.momo.vn',
      port: 443,
      path: '/gw_payment/transactionProcessor',
      body,
      // options: options
    },
    (error, { body }) => {
      // console.log(body)
      if (error) {
        console.log(error);
      } else {
        const result = JSON.parse(body);
        // console.log(result)
        if (result.errorCode !== 0) {
          res.status(400).json({
            status: 'fail',
            message: result.localMessage,
            url: 'http://localhost:3000/',
          });
        } else {
          res.status(200).json({
            status: 'success',
            message: result.localMessage,
            url: result.payUrl,
          });

          fs.readFile('db/db.json', (err, data) => {
            if (err) {
              console.log(err);
            } else {
              if (!JSON.parse(data)) {
                console.log('db error');
              } else {
                let parsedData = JSON.parse(data);
                for (let i = 0; i < parsedData.length; i++) {
                  if (parsedData[i].orderId === result.orderId) {
                    // parsedData[i].paymentId = id;
                    parsedData[i].date = date;
                    parsedData[i].status = 'pending';
                  }
                }

                fs.writeFile(
                  'db/db.json',
                  JSON.stringify(parsedData, null, 2),
                  (err) => {
                    if (err) throw err;
                    console.log('pending');
                  }
                );
              }
            }
          });
        }
      }
    }
  );
});

router.get('/return_momo/:orderId', function (req, res, next) {
  // console.log('momo:', req.query)

  if (req.query.errorCode == '00') {
    res.redirect('/success.html');
  } else {
    fs.readFile('db/db.json', (err, data) => {
      if (err) {
        console.log(err);
      } else {
        if (!JSON.parse(data)) {
          console.log('db error');
        } else {
          let parsedData = JSON.parse(data);
          for (let i = 0; i < parsedData.length; i++) {
            if (parsedData[i].orderId === req.params.orderId) {
              parsedData[i].paymentId = req.query.transId;
              parsedData[i].date = date;
              parsedData[i].status = 'canceled';
            }
          }

          fs.writeFile(
            'db/db.json',
            JSON.stringify(parsedData, null, 2),
            (err) => {
              if (err) throw err;
              console.log('canceled');
            }
          );
        }
      }
    });

    res.redirect('/err.html');
  }
});

module.exports = router;
