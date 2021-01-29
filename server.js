const express = require('express');
const path = require('path');
const app = express();
const fs = require('fs');
// const hbs = require('hbs');
const bodyParser = require('body-parser');

const momo = require('./routes/momo')
const paypal = require('./routes/paypal');
const vnpay = require('./routes/vnpay');

const publicPath = path.join(__dirname, 'public');

app.set('view engine', 'hbs');
app.set('views', publicPath);
app.use('/', express.static(publicPath));
app.use(bodyParser.json());

app.use('/paypal', paypal);
app.use('/momo', momo);
app.use('/vnpay', vnpay);

app.get('/', (req, res) => {
  res.redirect('/index.html');
});

app.get('/detail', (req, res) => {
  res.render('detail', {});
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
