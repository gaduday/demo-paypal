const express = require('express');
const path = require('path');
const app = express();
const paypal = require('paypal-rest-sdk');
const fs = require('fs');
const hbs = require('hbs');
const bodyParser = require('body-parser');

paypal.configure({
  mode: 'sandbox',
  client_id:
    'AQngdiShf_uTUODyh0GZOpqucjEoFQ3TdJec9aevvJDfbYoWs8nFYxNV94Boz3TZBukLvcwu2IxtnN_C',
  client_secret:
    'ELG789uU2HPgNmRH71YRvgBK4i70f9wVtwkAo6fdfsDBz--jUCmcrcSAU3WqycAphVH-e0CCVbSHhIO3',
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

let dynamicPaymentId = '';

app.post('/buy', (req, res) => {
  const create_payment_json = {
    intent: 'authorize',
    payer: {
      payment_method: 'paypal',
    },
    redirect_urls: {
      return_url: 'http://localhost:3000/success',
      cancel_url: 'http://localhost:3000/err/:id',
    },
    transactions: [
      {
        amount: {
          total: req.body.money,
          currency: 'USD',
        },
        description: req.body.reason,
      },
    ],
  };

  // createPay(payment).then((transaction) => {
  //   let id = transaction.id
  //   let links = transaction.links
  //   let counter = links.length

  //   while (counter--) {
  //     if (links[counter].method == 'REDIRECT') {
  //       console.log(links[counter].href);
  //       // return res.redirect(links[counter].href)
  //       res.status(200).json({ payUrl: links[counter].href });
  //     }
  //   }
  // }).catch((err) => {
  //   console.log(err)
  //   res.redirect('/err')
  // })

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      console.log(error);
    } else {
      let id = payment.id;
      let links = payment.links;
      let counter = links.length;
      let created_date = payment.create_time;
      dynamicPaymentId = payment.id;

      while (counter--) {
        if (links[counter].method == 'REDIRECT') {
          // return res.redirect(links[counter].href)
          res.status(200).json({
            payUrl: links[counter].href,
            money: req.body.money,
            reason: req.body.reason
          });
        }
      }

      const paymentInfo = {
        paymentId: id,
        status: 'pending',
        money: req.body.money,
        reason: req.body.reason,
        date: created_date,
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
                console.log('pending');
              }
            );
          }
        }
      });
    }
  });
});

app.get('/success', (req, res) => {
  fs.readFile('db/db.json', (err, data) => {
    if (err) {
      console.log(err);
    } else {
      if (!JSON.parse(data)) {
        console.log('db error');
      } else {
        let parsedData = JSON.parse(data);
        for (let i = 0; i < parsedData.length; i++) {
          if (parsedData[i].paymentId === req.query.paymentId) {
            // const newObj = {...parsedData[i], payerId: req.query.PayerID}
            parsedData[i].payerId = req.query.PayerID
            parsedData[i].date = date
            parsedData[i].status = "success"
          }
        }

        fs.writeFile(
          'db/db.json',
          JSON.stringify(parsedData, null, 2),
          (err) => {
            if (err) throw err;
            console.log('success');
          }
        );
      }
    }
  });
  res.redirect('/success.html');
});

app.get('/err/:id', (req, res) => {
  req.params.id = dynamicPaymentId;
  // console.log(req.params)
  fs.readFile('db/db.json', (err, data) => {
    if (err) {
      console.log(err);
    } else {
      if (!JSON.parse(data)) {
        console.log('db error');
      } else {
        let parsedData = JSON.parse(data);
        for (let i = 0; i < parsedData.length; i++) {
          if (parsedData[i].paymentId === req.params.id) {
            // const newObj = {...parsedData[i], payerId: req.query.PayerID}
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

app.listen(3000, () => {
  console.log('App listening on port 3000');
});

// const createPay = (payment) => {
//   return new Promise((resolve, reject) => {
//     paypal.payment.create(payment, function (err, payment) {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(payment);
//       }
//     });
//   });
// };
