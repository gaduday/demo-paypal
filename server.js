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

app.set('view engine', 'hbs');
app.set('views', publicPath);
app.use('/', express.static(publicPath));
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.redirect('/index.html');
});

app.post('/buy', (req, res) => {
  console.log('req= ', req.body);
  // console.log("res= ", res)
  const create_payment_json = {
    intent: 'authorize',
    payer: {
      payment_method: 'paypal',
    },
    redirect_urls: {
      return_url: 'http://localhost:3000/success',
      cancel_url: 'http://localhost:3000/err',
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
      console.log(payment)
      let id = payment.id;
      let links = payment.links;
      let counter = links.length;

      while (counter--) {
        if (links[counter].method == 'REDIRECT') {
          // return res.redirect(links[counter].href)
          res.status(200).json({ payUrl: links[counter].href });
        }
      }
    }
  });
});

app.get('/success', (req, res) => {
  console.log(req.query);
  res.redirect('/success.html');

  let paymentInfo = {
    paymentId: req.query.paymentId,
    payerId: req.query.PayerID,
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
            console.log('success');
          }
        );
      }
    }
  });
});

app.get('/err', (req, res) => {
  console.log(req.query);
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

const createPay = (payment) => {
  return new Promise((resolve, reject) => {
    paypal.payment.create(payment, function (err, payment) {
      if (err) {
        reject(err);
      } else {
        resolve(payment);
      }
    });
  });
};
