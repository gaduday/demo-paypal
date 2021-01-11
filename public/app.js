// const paymentButton = document.querySelector('#payment-button')
// const detailPayment = document.getElementById('detail-payment');

// paymentButton.addEventListener("click", (e) => {
//   // e.preventDefault()
//   const money = document.getElementById("payment-money").value
//   const reason = document.getElementById("info").value
//   const name = document.getElementById('name').value;
//   const phone = document.getElementById('phone').value;
//   const email = document.getElementById('email').value;

//   const errorMoney = document.querySelector("#error-money")
//   const errorEmail = document.querySelector("#error-email")
//   const errorPhone = document.querySelector("#error-phone")

//   if (money <= 0 || money == "") {
//     errorMoney.textContent = 'invalid money';
//     return
//   } else {
//     errorMoney.textContent = '';
//     // return
//   }

//   const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

//   if (!re.test(String(email).toLocaleLowerCase()) || email == "") {
//     errorEmail.textContent = 'invalid email';
//     return;
//   } else {
//     errorEmail.textContent = '';
//     // return
//   }

//   // await fetch('/buy?money=' + money + '&reason=' + reason)
//   //   .then((response) => {
//   //     response.json().then((data) => {
//   //       console.log("data= +", data)
//   //     });
//   //   })
//   //   .catch((err) => {
//   //     console.log(err);
//   //   });

//   fetch('/detail', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       money,
//       reason,
//       name,
//       phone,
//       email
//     }),
//   })
//     .then((response) => {
//       // console.log(response)
//       response.json().then((data) => {
//         // const detailPayment = document.querySelector('.detail-payment');
//         console.log(data)
//         const detail =
//         `<p>Tiền: $${data.money}</p>
//           <p>Nội dung: ${data.reason}</p>
//           <p>Tên: ${data.name}</p>
//           <p>Phone: ${data.phone}</p>
//           <p>Email: ${data.email}</p>
//         `;
//         console.log(detail)
//         detailPayment.innerHTML = detail;
//         window.location.href = '/detail'; 
//       });
//     })
//     .catch((err) => {
//       console.log(err);
//     });
// })



const paymentButton = document.querySelector('#payment-button')
paymentButton.addEventListener("click", (e) => {
  const money = document.getElementById('payment-money').value;
  const reason = document.getElementById('info').value;
  const name = document.getElementById('name').value;
  const phone = document.getElementById('phone').value;
  const email = document.getElementById('email').value;

  // sessionStorage.setItem(
  //   'info',
  //   `<p id="money">Tiền: ${money}</p>
  //    <p id="reason">Nội dung: ${reason}</p>
  //    <p id="name">Tên: ${name}</p>
  //    <p id="phone">Phone: ${phone}</p>
  //    <p id="email">Email: ${email}</p>
  //   `
  // );

  const arrayInfo = [money, reason, name, phone, email];
  sessionStorage.setItem('info', JSON.stringify(arrayInfo));
})

