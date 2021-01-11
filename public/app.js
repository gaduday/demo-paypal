const paymentButton = document.querySelector('#payment-button')
const money = document.getElementById('payment-money').value;
const reason = document.getElementById('info').value;
const name = document.getElementById('name').value;
const phone = document.getElementById('phone').value;
const email = document.getElementById('email').value;

const toggleButton = (input) => { 
  if (input.value != '') {
    paymentButton.disabled = false;
  } else {
    paymentButton.disabled = true;
  }
}

paymentButton.addEventListener("click", (e) => {
  const arrayInfo = [money, reason, name, phone, email];
  sessionStorage.setItem('info', JSON.stringify(arrayInfo));
})

