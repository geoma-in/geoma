let entries = [];
let editIndex = null;

const addTable = document.querySelector("#addTable tbody");
const lessTable = document.querySelector("#lessTable tbody");
const runningTable = document.querySelector("#running-calc tbody");
const miscTable = document.querySelector("#miscellaneous tbody");

function updateBalance() {
  const totalAdd = entries.filter(e => e.type === 'add').reduce((s, e) => s + e.amount, 0);
  const totalLess = entries.filter(e => e.type === 'less').reduce((s, e) => s + e.amount, 0);
  const totalMisc = entries.filter(e => e.type === 'misc').reduce((s, e) => s + e.amount, 0);
  const totalRunning = entries.filter(e => e.type === 'running').reduce((s, e) => s + e.amount, 0);
  const received = parseFloat(document.getElementById("amountReceived").value || 0);

  document.getElementById("grandAddTotal").innerText = (totalAdd + totalMisc + totalRunning).toFixed(0);
  document.getElementById("lessTotal").innerText = totalLess.toFixed(0);
  document.getElementById("netTotal").innerText = (totalAdd + totalMisc + totalRunning - totalLess).toFixed(0);
  document.getElementById("balance").innerText = (totalAdd + totalMisc + totalRunning - totalLess - received).toFixed(0);
}

function renderTables() {
  addTable.innerHTML = "";
  lessTable.innerHTML = "";
  runningTable.innerHTML = "";
  miscTable.innerHTML = "";
  let addCount = 1, lessCount = 1, runningCount = 1, miscCount = 1;

  entries.forEach((e, idx) => {
    if (e.type === 'add' || e.type === 'less') {
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
        <td>
          <button onclick="editEntry(${idx})">Edit</button>
          <button onclick="deleteEntry(${idx})">Delete</button>
        </td>
      `;
      const tr = document.createElement("tr");
      tr.innerHTML = rowHTML;
      if (e.type === "add") addTable.appendChild(tr);
      else lessTable.appendChild(tr);
    } else if (e.type === 'running') {
      const rowHTML = `
        <td>${runningCount++}</td>
        <td>${e.spaceType}</td>
        <td>${e.runningFeet}</td>
        <td>${e.area}</td>
        <td>${e.rate}</td>
        <td>${e.amount}</td>
        <td>
          <button onclick="editEntry(${idx})">Edit</button>
          <button onclick="deleteEntry(${idx})">Delete</button>
        </td>
      `;
      const tr = document.createElement("tr");
      tr.innerHTML = rowHTML;
      runningTable.appendChild(tr);
    } else if (e.type === 'misc') {
      const rowHTML = `
        <td>${miscCount++}</td>
        <td>${e.chargeType}</td>
        <td>${e.days}</td>
        <td>${e.extraHours}</td>
        <td>${e.rate}</td>
        <td>${e.amount}</td>
        <td>
          <button onclick="editEntry(${idx})">Edit</button>
          <button onclick="deleteEntry(${idx})">Delete</button>
        </td>
      `;
      const tr = document.createElement("tr");
      tr.innerHTML = rowHTML;
      miscTable.appendChild(tr);
    }
  });

  updateBalance();
}

function deleteEntry(index) {
  entries.splice(index, 1);
  renderTables();
}

function editEntry(index) {
  const e = entries[index];
  editIndex = index;
  document.getElementById("entryType").value = e.type;

  if (e.type === 'add' || e.type === 'less') {
    document.getElementById("spaceType").value = e.spaceType;
    document.getElementById("feet").value = e.feet;
    document.getElementById("inch").value = e.inch;
    document.getElementById("feet2").value = e.feet2;
    document.getElementById("inch2").value = e.inch2;
    document.getElementById("rate").value = e.rate;
  } else if (e.type === 'running') {
    document.getElementById("spaceType").value = e.spaceType;
    document.getElementById("feet").value = e.runningFeet;
    document.getElementById("inch").value = 0;
    document.getElementById("feet2").value = 1;
    document.getElementById("inch2").value = 0;
    document.getElementById("rate").value = e.rate;
  } else if (e.type === 'misc') {
    document.getElementById("spaceType").value = e.chargeType;
    document.getElementById("feet").value = e.days;
    document.getElementById("inch").value = e.extraHours;
    document.getElementById("feet2").value = 1;
    document.getElementById("inch2").value = 0;
    document.getElementById("rate").value = e.rate;
  }
}

document.getElementById("inputForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const feet = parseFloat(document.getElementById("feet").value);
  const inch = parseFloat(document.getElementById("inch").value);
  const feet2 = parseFloat(document.getElementById("feet2").value);
  const inch2 = parseFloat(document.getElementById("inch2").value);
  const rate = parseFloat(document.getElementById("rate").value);
  const spaceType = document.getElementById("spaceType").value;
  const type = document.getElementById("entryType").value;

  let area = 0, amount = 0;

  if (type === 'add' || type === 'less') {
    const length = feet + inch / 12;
    const width = feet2 + inch2 / 12;
    area = +(length * width).toFixed(2);
    amount = +(area * rate).toFixed(0);
    var newEntry = { spaceType, feet, inch, feet2, inch2, rate, type, area, amount };
  } else if (type === 'running') {
    const runningFeet = feet;
    area = +(runningFeet * 1).toFixed(2);
    amount = +(area * rate).toFixed(0);
    var newEntry = { spaceType, runningFeet, rate, type, area, amount };
  } else if (type === 'misc') {
    const days = feet;
    const extraHours = inch;
    const extraDays = extraHours / 8;
    const fullDays = days + extraDays;
    amount = +(fullDays * rate).toFixed(0);
    var newEntry = { chargeType: spaceType, days, extraHours, rate, type, amount };
  }

  if (editIndex !== null) {
    entries[editIndex] = newEntry;
    editIndex = null;
  } else {
    entries.push(newEntry);
  }

  document.getElementById("inputForm").reset();
  renderTables();
});
