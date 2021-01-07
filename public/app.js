const paymentButton = document.querySelector('#payment-button')

paymentButton.addEventListener("click", (e) => {
  e.preventDefault()
  const money = document.getElementById("payment-money").value
  const reason = document.getElementById("info").value
  const error = document.querySelector("#error")

  if (money <= 0) {
    error.textContent = "invalid money"
    return
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