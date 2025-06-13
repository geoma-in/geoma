let entries = [];
let editIndex = null;

const addTable = document.querySelector("#addTable tbody");
const lessTable = document.querySelector("#lessTable tbody");

function updateBalance() {
  const totalAdd = entries.filter(e => e.type === 'add').reduce((s, e) => s + e.total, 0);
  const totalLess = entries.filter(e => e.type === 'less').reduce((s, e) => s + e.total, 0);
  const received = parseFloat(document.getElementById("amountReceived").value || 0);
  document.getElementById("grandAddTotal").innerText = totalAdd.toFixed(0);
  document.getElementById("lessTotal").innerText = totalLess.toFixed(0);
  document.getElementById("netTotal").innerText = (totalAdd - totalLess).toFixed(0);
  document.getElementById("balance").innerText = (totalAdd - totalLess - received).toFixed(0);
}

function renderTables() {
  addTable.innerHTML = "";
  lessTable.innerHTML = "";
  let addCount = 1, lessCount = 1;

  entries.forEach((e, idx) => {
    const rowHTML = `
      <td>${e.type === 'add' ? addCount++ : lessCount++}</td>
      <td>${e.spaceType}</td>
      <td>${e.feet}</td>
      <td>${e.inch}</td>
      <td>${e.feet2}</td>
      <td>${e.inch2}</td>
      <td>${e.area}</td>
      <td>${e.rate}</td>
      <td>${e.amount}</td>
      <td>${e.floorCount}</td>
      <td>${e.total}</td>
      <td>
        <button onclick="editEntry(${idx})">Edit</button>
        <button onclick="deleteEntry(${idx})">Delete</button>
      </td>
    `;
    const tr = document.createElement("tr");
    tr.innerHTML = rowHTML;
    if (e.type === "add") addTable.appendChild(tr);
    else lessTable.appendChild(tr);
  });

  updateBalance();
}

function deleteEntry(index) {
  entries.splice(index, 1);
  renderTables();
}

function editEntry(index) {
  const e = entries[index];
  document.getElementById("spaceType").value = e.spaceType;
  document.getElementById("feet").value = e.feet;
  document.getElementById("inch").value = e.inch;
  document.getElementById("feet2").value = e.feet2;
  document.getElementById("inch2").value = e.inch2;
  document.getElementById("rate").value = e.rate;
  document.getElementById("floorCount").value = e.floorCount;
  document.getElementById("entryType").value = e.type;
  editIndex = index;
}

document.getElementById("inputForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const feet = parseFloat(document.getElementById("feet").value);
  const inch = parseFloat(document.getElementById("inch").value);
  const feet2 = parseFloat(document.getElementById("feet2").value);
  const inch2 = parseFloat(document.getElementById("inch2").value);
  const rate = parseFloat(document.getElementById("rate").value);
  const floorCount = parseInt(document.getElementById("floorCount").value);
  const spaceType = document.getElementById("spaceType").value;
  const type = document.getElementById("entryType").value;

  const length = feet + inch / 12;
  const width = feet2 + inch2 / 12;
  const area = +(length * width).toFixed(2);
  const amount = +(area * rate).toFixed(0);
  const total = amount * floorCount;

  const newEntry = { spaceType, feet, inch, feet2, inch2, rate, floorCount, type, area, amount, total };

  if (editIndex !== null) {
    entries[editIndex] = newEntry;
    editIndex = null;
  } else {
    entries.push(newEntry);
  }

  document.getElementById("inputForm").reset();
  renderTables();
});
