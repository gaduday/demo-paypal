fetch('/list', {
  method: 'POST',
}).then((response) => {
  response.json().then((data) => {
    const listPayment = document.querySelector('.list-payment');
    const dataPayment = data.payment;
    const listItems = dataPayment.map((element) => {
      return `<li id='${element.paymentId} 'class='listItem'>
          <b>Payer ID: ${element.payerId}</b>
          <p>Payment ID: ${element.paymentId}></p>
        </li>`;
    });
    listPayment.innerHTML = listItems.join('');
  });
});
