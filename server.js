const express = require('express');
const path = require('path');
const app = express();
const paypal = require('paypal-rest-sdk');
const fs = require('fs');
const hbs = require('hbs');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();
const { v1: uuidv1 } = require('uuid');

paypal.configure({
  mode: 'sandbox',
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
});

const publicPath = path.join(__dirname, 'public');

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

app.set('view engine', 'hbs');
app.set('views', publicPath);
app.use('/', express.static(publicPath));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.redirect('/index.html');
});

app.post('/pay', (req, res) => {
  // console.log(req.body)
  let orderId = uuidv1();
  // console.log(orderId);
  const create_payment_json = {
    intent: 'authorize',
    payer: {
      payment_method: 'paypal',
    },
    redirect_urls: {
      return_url: `http://localhost:3000/success/${orderId}`,
      cancel_url: `http://localhost:3000/err/${orderId}`,
    },
    transactions: [
      {
        amount: {
          total: req.body.money,
          currency: 'USD',
        },
        invoice_number: orderId,
        description: req.body.reason,
      },
    ],
  };

  const paymentInfo = {
    orderId,
    paymentId: '',
    payerId: '',
    status: 'created',
    money: req.body.money,
    reason: req.body.reason,
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

  paypal.payment.create(create_payment_json, function (error, payment) {
    // console.log(create_payment_json)
    if (error) {
      console.log(error);
    } else {
      // console.log(payment);

      let id = payment.id;
      let links = payment.links;
      let counter = links.length;

      while (counter--) {
        if (links[counter].method == 'REDIRECT') {
          res.status(200).json({
            orderId,
            payUrl: links[counter].href,
            paymentId: id,
            status: 'pending',
            money: req.body.money,
            reason: req.body.reason,
            name: req.body.name,
            phone: req.body.phone,
            email: req.body.email,
            date,
          });
        }
      }

      fs.readFile('db/db.json', (err, data) => {
        if (err) {
          console.log(err);
        } else {
          if (!JSON.parse(data)) {
            console.log('db error');
          } else {
            // const pendingPaymentInfo = {...paymentInfo, paymentId: id}

            let parsedData = JSON.parse(data);
            for (let i = 0; i < parsedData.length; i++) {
              if (
                parsedData[i].orderId === payment.transactions[0].invoice_number
              ) {
                parsedData[i].paymentId = id;
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
  });
});

app.get('/detail', (req, res) => {
  res.render('detail', {});
});

app.get('/success/:orderId', (req, res) => {
  let emailToSend = '';
  let moneyToSend = 0;
  // console.log(req.params.orderId);

  let paymentId = req.query.paymentId;
  let payerId = { payer_id: req.query.PayerID };

  paypal.payment.execute(paymentId, payerId, function (error, payment) {
    // console.log(payment)
    if (error) {
      console.error(JSON.stringify(error));
    } else {
      if (payment.state == 'approved') {
        fs.readFile('db/db.json', (err, data) => {
          if (err) {
            console.log(err);
          } else {
            if (!JSON.parse(data)) {
              console.log('db error');
            } else {
              let parsedData = JSON.parse(data);
              for (let i = 0; i < parsedData.length; i++) {
                if (
                  parsedData[i].paymentId === req.query.paymentId &&
                  parsedData[i].orderId === req.params.orderId
                ) {
                  parsedData[i].payerId = req.query.PayerID;
                  parsedData[i].date = date;
                  parsedData[i].status = 'success';
                  emailToSend = parsedData[i].email;
                  moneyToSend = parsedData[i].money;
                }
              }

              // console.log('req.query: ', req.query);
              // console.log('req.params: ', req.params);

              fs.writeFile(
                'db/db.json',
                JSON.stringify(parsedData, null, 2),
                (err) => {
                  if (err) throw err;
                  console.log('success');
                }
              );

              const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: process.env.EMAIL,
                  pass: process.env.PASSWORD,
                },
              });

              const mailOptions = {
                from: process.env.EMAIL,
                to: emailToSend,
                subject: 'thôi xong',
                text: `bạn đã quyên góp VND${
                  moneyToSend * 23051.1
                } cho chiến dịch từ thiện của lũ hậu`,
              };

              transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                }
              });
            }
          }
        });
      } else {
        console.log('payment not successful');
        res.redirect('/err.html');
      }
    }
  });

  res.redirect('/success.html');
});

app.get('/err/:orderId', (req, res) => {
  // console.log(req.params)
  // console.log(req.query)

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
});

app.post('/list', (req, res) => {
  fs.readFile('db/db.json', (err, data) => {
    if (err) {
      console.log(err);
    } else {
      if (!JSON.parse(data)) {
        console.log('db error');
      } else {
        let parsedData = JSON.parse(data);
        res.status(200).json({ payment: parsedData });
      }
    }
  });
});

app.get('/list', (req, res) => {
  fs.readFile('db/db.json', (err, data) => {
    if (err) {
      console.log(err);
    } else {
      if (!JSON.parse(data)) {
        console.log('db error');
      } else {
        let parsedData = JSON.parse(data);
        res.render('list', {
          list: parsedData,
        });
      }
    }
  });
});

app.post('/create_payment_url', (req, res, next) => {
  let ipAddr =
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  let tmnCode = process.env.TMN_CODE;
  let secretKey = process.env.HASH_SECRET;
  let vnpUrl = 'http://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  let returnUrl = 'http://localhost:3000/vnpay_return';
  // let createDate = date;
  let newDate = new Date(); //
  let dateFormat = require('dateformat');
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

  let queryString = require('qs');
  let signData =
    secretKey + queryString.stringify(vnp_Params, { encode: false });

  let sha256 = require('sha256');
  let secureHash = sha256(signData);

  vnp_Params['vnp_SecureHashType'] = 'SHA256';
  vnp_Params['vnp_SecureHash'] = secureHash;
  vnpUrl += '?' + queryString.stringify(vnp_Params, { encode: true });

  res.status(200).json({ code: '200', payUrl: vnpUrl });
});

app.get('/vnpay_return', function (req, res, next) {
  // console.log('return:', req.query);
  let vnp_Params = req.query;

  let secureHash = vnp_Params['vnp_SecureHash'];

  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  vnp_Params = sortObject(vnp_Params);

  // let config = require('config');
  let tmnCode = process.env.TMN_CODE;
  let secretKey = process.env.HASH_SECRET;

  let querystring = require('qs');
  let signData =
    secretKey + querystring.stringify(vnp_Params, { encode: false });

  let sha256 = require('sha256');

  let checkSum = sha256(signData);

  // console.log('secureHash: ', secureHash);
  // console.log('checkSum: ', checkSum);

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

app.get('/vnpay_ipn', function (req, res, next) {
  // console.log('ipn:', req.query)
  let vnp_Params = req.query;
  let secureHash = vnp_Params['vnp_SecureHash'];

  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  vnp_Params = sortObject(vnp_Params);
  // let config = require('config');
  let secretKey = process.env.HASH_SECRET;
  let querystring = require('qs');
  let signData =
    secretKey + querystring.stringify(vnp_Params, { encode: false });

  let sha256 = require('sha256');

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

app.post('/momo', (req, res, next) => {
  const crypto = require('crypto');
  const https = require('https');
  const request = require('request');

  let endpoint = 'https://test-payment.momo.vn/gw_payment/transactionProcessor';
  let hostname = 'https://test-payment.momo.vn';
  // let path = '/gw_payment/transactionProcessor';
  let partnerCode = 'MOMOIQA420180417';
  let accessKey = 'Q8gbQHeDesB2Xs0t';
  let secretKey = 'PPuDXq1KowPT1ftR8DvlQTHhC03aul17';
  // let partnerCode = 'MOMOG1DU20201224';
  // let accessKey = '0Qx3J4zHtubPGuMz';
  // let secretKey = '31b9nvtNZxvQmoMu204WPYVpoWkxKxKt';
  let orderInfo = req.body.reason;
  let orderId = uuidv1();
  let requestId = uuidv1();
  let returnUrl = `http://localhost:3000/return_momo/${orderId}`;
  let notifyUrl = 'https://api.mt.gialai.dulieutnmt.vn:8989/';
  let amount = (req.body.money * 23000).toString();
  // let orderId = '218c34e0-4a83-11eb-bfc5-312423ab6cfb';
  // let requestId = '218c34e0-4a83-11eb-bfc5-312423ab6cfc';
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

  // let options = {
  //   hostname: 'test-payment.momo.vn',
  //   port: 443,
  //   path: '/gw_payment/transactionProcessor',
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Content-Length': Buffer.byteLength(body),
  //   },
  // };
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
        // callback("error", undefined);
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
                // const pendingPaymentInfo = {...paymentInfo, paymentId: id}

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

        // res.redirect(payUrl);
      }
    }
  );
});

app.get('/return_momo/:orderId', function (req, res, next) {
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

app.get('*', (req, res) => {
  res.render('404', {
    title: '404',
    errorMessage: 'Page not found',
  });
});

app.listen(3000, () => {
  console.log('App listening on port 3000');
});
