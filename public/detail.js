// fetch('/detail', {
//   method: 'POST',
//   headers: {
//     'Content-Type': 'application/json',
//   },
//   body: JSON.stringify({
//     money,
//     reason,
//     name: name,
//     phone,
//     email,
//   }),
// })
//   .then((response) => {
//     // console.log(response)
//     response.json().then((data) => {
//       // const detailPayment = document.querySelector('.detail-payment');
//       console.log(data);
//       const detail = `<p>Tiền: $${data.money}</p>
//           <p>Nội dung: ${data.reason}</p>
//           <p>Tên: ${data.name}</p>
//           <p>Phone: ${data.phone}</p>
//           <p>Email: ${data.email}</p>
//         `;
//       console.log(detail);
//       console.log(detailPayment);
//       detailPayment.innerHTML = detail;
//       window.location.href = '/detail';
//     });
//   })
//   .catch((err) => {
//     console.log(err);
//   });


const detailPayment = document.getElementById('detail-payment');
// const detailPayment = document.get('row-info');
const result = sessionStorage.getItem('info');
const parsedResult = JSON.parse(result);
console.log(parsedResult)
const money = document.getElementById('money');
const reason = document.getElementById('reason');
const name = document.getElementById('name');
const phone = document.getElementById('phone');
const email = document.getElementById('email');

money.textContent = parsedResult[0];
reason.textContent = parsedResult[1];
name.textContent = parsedResult[2];
phone.textContent = parsedResult[3];
email.textContent = parsedResult[4];

const submitButton = document.querySelector('#submit-button')
submitButton.addEventListener('click', (e) => {
  e.preventDefault();

  console.log(reason)

  fetch('/pay', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      money: money.textContent,
      reason: reason.textContent,
      name: name.textContent,
      phone: phone.textContent,
      email: email.textContent
    }),
  })
    .then((response) => {
      // console.log(response)
      response.json().then((data) => {
        // const detailPayment = document.querySelector('.detail-payment');
        console.log(data);
        window.location.href = data.payUrl;
      });
    })
    .catch((err) => {
      console.log(err);
    });
});
