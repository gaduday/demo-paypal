fetch('/list', {
  method: 'POST',
}).then((response) => {
  response.json().then((data) => {
    const tablePayment = document.querySelector('table');
    const dataPayment = data.payment;
    const keyTablePayment = Object.keys(dataPayment[0]);
    generateTable(tablePayment, dataPayment);
  });
});

const generateTableHead = (table, data) => {
  let thead = table.createTHead();
  let row = thead.insertRow();
  for (let key of data) {
    let th = document.createElement('th');
    let text = document.createTextNode(key);
    th.appendChild(text);
    row.appendChild(th);
  }
}

const generateTable = (table, data) => {
  for (let element of data) {
    let row = table.insertRow();
    for (key in element) {
      let cell = row.insertCell();
      let text = document.createTextNode(element[key]);
      cell.appendChild(text);
    }
  }
}