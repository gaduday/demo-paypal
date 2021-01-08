const paymentButton = document.querySelector('#payment-button')

paymentButton.addEventListener("click", (e) => {
  e.preventDefault()
  const money = document.getElementById("payment-money").value
  const reason = document.getElementById("info").value
  const name = document.getElementById('name').value;
  const phone = document.getElementById('phone').value;
  const email = document.getElementById('email').value;

  const errorMoney = document.querySelector("#error-money")
  const errorEmail = document.querySelector("#error-email")
  const errorPhone = document.querySelector("#error-phone")

  if (money <= 0 || money == "") {
    errorMoney.textContent = 'invalid money';
    return
  } else {
    errorMoney.textContent = '';
    // return
  }

  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  if (!re.test(String(email).toLocaleLowerCase()) || email == "") {
    errorEmail.textContent = 'invalid email';
    return;
  } else {
    errorEmail.textContent = '';
    // return
  }

  // await fetch('/buy?money=' + money + '&reason=' + reason)
  //   .then((response) => {
  //     response.json().then((data) => {
  //       console.log("data= +", data)
  //     });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //   });

  fetch('/buy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      money,
      reason,
    }),
  })
    .then((response) => {
      response.json().then((data) => {
        window.location.href = data.payUrl
      });
    })
    .catch((err) => {
      console.log(err);
    });
})