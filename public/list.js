fetch('/list', {
  method: 'POST',
}).then((response) => {
  response.json().then((data) => {
    console.log(data)
    const listPayment = document.querySelector('.list-payment');
    const dataPayment = data.payment;
    const listItems = dataPayment.map((element) => {
      return `<li id='${element.paymentId} 'class='listItem'>
          <p>Payer ID: ${element.payerId ? element.payerId : ""}</p>
          <p>Payment ID: ${element.paymentId}</p>
          <p>Money: $${element.money}</p>
          <p>Reason: ${element.reason}</p>
          <p>Status: ${element.status}</p>
        </li>`;
    });
    listPayment.innerHTML = listItems.join('');
  });
});
