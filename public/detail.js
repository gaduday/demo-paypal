const detailPayment = document.getElementById('detail-payment');
const result = sessionStorage.getItem('info');
const parsedResult = JSON.parse(result);
const money = document.getElementById('money');
const reason = document.getElementById('reason');
const name = document.getElementById('name');
const phone = document.getElementById('phone');
const email = document.getElementById('email');

const submitButton = document.querySelector('#submit-button')

money.textContent = parsedResult[0];
reason.textContent = parsedResult[1];
name.textContent = parsedResult[2];
phone.textContent = parsedResult[3];
email.textContent = parsedResult[4];

const toggleButton = (input) => {
  if (input.value !== '') {
    submitButton.disabled = false;
  } else {
    submitButton.disabled = true;
  }
}

// submitButton.addEventListener('click', (e) => {
//   e.preventDefault();

//   console.log(reason)

//   fetch('/pay', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       money: money.textContent,
//       reason: reason.textContent,
//       name: name.textContent,
//       phone: phone.textContent,
//       email: email.textContent
//     }),
//   })
//     .then((response) => {
//       response.json().then((data) => {
//         window.location.href = data.payUrl;
//       });
//     })
//     .catch((err) => {
//       console.log(err);
//     });
// });

const submitForm = () => {
  // e.preventDefault();
  submitButton.setAttribute('disabled', 'disabled')

  console.log(reason);

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
      email: email.textContent,
    }),
  })
    .then((response) => {
      response.json().then((data) => {
        window.location.href = data.payUrl;
      });
    })
    .catch((err) => {
      console.log(err);
    });
}