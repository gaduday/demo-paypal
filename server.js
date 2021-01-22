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
      // console.log(payment)

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
              if (parsedData[i].orderId === payment.transactions[0].invoice_number) {
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
  res.render('detail', {
    
  });
});

app.get('/success/:orderId', (req, res) => {
  let emailToSend = "";
  let moneyToSend = 0;
  // console.log(req.params.id)

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

app.get('*', (req, res) => {
  res.render('404', {
    title: '404',
    errorMessage: 'Page not found',
  });
});

app.listen(3000, () => {
  console.log('App listening on port 3000');
});

