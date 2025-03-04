// Shared data
let members = JSON.parse(localStorage.getItem("members")) || [];
let payments = JSON.parse(localStorage.getItem("payments")) || [];
let rounds = JSON.parse(localStorage.getItem("rounds")) || [];

// Function to save data to localStorage
function saveData() {
  localStorage.setItem("members", JSON.stringify(members));
  localStorage.setItem("payments", JSON.stringify(payments));
  localStorage.setItem("rounds", JSON.stringify(rounds));
}

// Function to recalculate totalPayment and remainingPayment for a member
function recalculatePayments(memberId) {
  const payment = payments.find(p => p.id === memberId);
  if (payment) {
    payment.totalPayment = 0;
    for (let i = 0; i < rounds.length; i++) {
      const roundKey = `round${i + 1}`;
      if (payment[roundKey] && payment[roundKey].amount) {
        payment.totalPayment += payment[roundKey].amount;
      }
    }
    payment.remainingPayment = (payment.expectedPerWeek * rounds.length) - payment.totalPayment;
  }
}

// Function to add a new round
function addRound(date) {
  if (!date.startsWith("Round ")) {
    date = `Round ${date}`;
  }

  rounds.push(date);
  saveData();
  alert("Round Added!");
  exportToCSV(); // Export tables after adding a round
  window.location.href = "rounds.html"; // Redirect to Rounds Page
}

// Function to delete a round
function deleteRound(index) {
  if (confirm("Are you sure you want to delete this round?")) {
    rounds.splice(index, 1);
    saveData();
    populateRoundsTable();
    populateMembersTable();
    populateRemainingPaymentsTable();
    setTimeout(() => updateReportChart(), 0);
  }
}

// Function to populate the members table
function populateMembersTable() {
  const table = document.getElementById("membersTable");
  if (!table) return;
  const tbody = table.getElementsByTagName("tbody")[0];
  tbody.innerHTML = ""; // Clear existing rows

  // Create data rows
  payments.forEach(payment => {
    const row = tbody.insertRow();
    row.insertCell(0).textContent = payment.id;
    row.insertCell(1).textContent = payment.name;
    row.insertCell(2).textContent = payment.expectedPerWeek;
    row.insertCell(3).textContent = payment.expectedPerWeek * rounds.length; // Expected Total
    row.insertCell(4).textContent = payment.totalPayment;
    row.insertCell(5).textContent = (payment.expectedPerWeek * rounds.length) - payment.totalPayment; // Remaining Payment

    // Add edit and delete buttons
    const actionsCell = row.insertCell(6);
    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => editMember(payment.id));
    actionsCell.appendChild(editButton);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("delete");
    deleteButton.addEventListener("click", () => deleteMember(payment.id));
    actionsCell.appendChild(deleteButton);
  });

  // Add search functionality
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const searchTerm = searchInput.value.toLowerCase();
      const rows = tbody.getElementsByTagName("tr");
      Array.from(rows).forEach(row => {
        const id = row.cells[0].textContent.toLowerCase();
        const name = row.cells[1].textContent.toLowerCase();
        row.style.display = (id.includes(searchTerm) || (name.includes(searchTerm))) ? "" : "none";
      });
    });
  }
}

// Function to populate the rounds table
function populateRoundsTable() {
  const table = document.getElementById("roundsTable");
  if (!table) return;
  const thead = table.getElementsByTagName("thead")[0];
  const tbody = table.getElementsByTagName("tbody")[0];

  // Clear existing rows
  thead.innerHTML = "";
  tbody.innerHTML = "";

  // Create header row
  const headerRow = thead.insertRow();
  headerRow.insertCell(0).textContent = "ID";
  headerRow.insertCell(1).textContent = "Name";
  rounds.forEach((round, index) => {
    const cell = headerRow.insertCell(index + 2);
    cell.textContent = round;

    // Add space and edit button to the header
    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.style.marginLeft = "10px"; // Add space between round and edit button
    editButton.addEventListener("click", () => editRoundHeader(index));
    cell.appendChild(editButton);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("delete");
    deleteButton.addEventListener("click", () => deleteRound(index));
    cell.appendChild(deleteButton);
  });

  // Create data rows
  payments.forEach(payment => {
    const row = tbody.insertRow();
    row.insertCell(0).textContent = payment.id;
    row.insertCell(1).textContent = payment.name;
    rounds.forEach((round, index) => {
      const cell = row.insertCell(index + 2);
      const roundData = payment[`round${index + 1}`] || {};
      cell.textContent = roundData.bank ? `${roundData.bank}: ${roundData.amount}` : "-";
      cell.classList.add("editable"); // Make the cell editable
      cell.addEventListener("click", () => editRoundCell(payment.id, index));
    });
  });
}

// Function to edit a round from the header
function editRoundHeader(index) {
  const newDate = prompt("Enter new date for the round:", rounds[index]);
  if (newDate) {
    rounds[index] = `Round ${newDate}`;
    saveData();
    populateRoundsTable();
    populateMembersTable();
    populateRemainingPaymentsTable();
    setTimeout(() => updateReportChart(), 0);
  }
}

// Function to edit a round cell
function editRoundCell(memberId, roundIndex) {
  const payment = payments.find(p => p.id === memberId);
  if (payment) {
    const roundKey = `round${roundIndex + 1}`;
    const currentRound = payment[roundKey] || {};
    const bank = prompt("Enter bank name:", currentRound.bank || "");
    const amount = parseFloat(prompt("Enter amount:", currentRound.amount || ""));
    if (bank && !isNaN(amount)) {
      payment[roundKey] = { bank, amount };
      recalculatePayments(memberId);
      saveData();
      populateMembersTable();
      populateRoundsTable();
      populateRemainingPaymentsTable();
      setTimeout(() => updateReportChart(), 0); // Update the report chart
    }
  }
}

// Function to populate the remaining payments table
function populateRemainingPaymentsTable() {
  const table = document.getElementById("remainingPaymentsTable");
  if (!table) return;
  const tbody = table.getElementsByTagName("tbody")[0];
  tbody.innerHTML = ""; // Clear existing rows

  // Filter members with remaining payments > 0
  const remainingMembers = payments.filter(payment => payment.remainingPayment > 0);

  // Create data rows
  remainingMembers.forEach(payment => {
    const row = tbody.insertRow();
    row.insertCell(0).textContent = payment.id;
    row.insertCell(1).textContent = payment.name;
    row.insertCell(2).textContent = payment.expectedPerWeek * rounds.length; // Expected Total
    row.insertCell(3).textContent = payment.remainingPayment; // Remaining Payment
  });
}

// Function to delete a member
function deleteMember(id) {
  if (confirm("Are you sure you want to delete this member?")) {
    members = members.filter(member => member.id !== id);
    payments = payments.filter(payment => payment.id !== id);
    saveData();
    populateMembersTable();
    populateRoundsTable();
    populateRemainingPaymentsTable();
    setTimeout(() => updateReportChart(), 0); // Update the report chart
  }
}

// Function to edit a member
function editMember(id) {
  const member = members.find(m => m.id === id);
  if (member) {
    const newName = prompt("Enter new name:", member.name);
    const newExpectedPerWeek = parseFloat(prompt("Enter new expected payment per week:", member.expectedPerWeek));
    if (newName && !isNaN(newExpectedPerWeek)) {
      member.name = newName;
      member.expectedPerWeek = newExpectedPerWeek;

      // Update corresponding payment
      const payment = payments.find(p => p.id === id);
      if (payment) {
        payment.name = newName;
        payment.expectedPerWeek = newExpectedPerWeek;
        recalculatePayments(id);
      }
      saveData();
      populateMembersTable();
      populateRoundsTable();
      populateRemainingPaymentsTable();
      setTimeout(() => updateReportChart(), 0); // Update the report chart
    }
  }
}

// Function to add a new member
function addMember(name, expectedPerWeek) {
  const newMember = {
    id: members.length + 1,
    name,
    expectedPerWeek,
    totalPayment: 0,
    remainingPayment: expectedPerWeek * rounds.length,
  };
  members.push(newMember);
  const newPayment = {
    id: newMember.id,
    name,
    expectedPerWeek,
    ...rounds.reduce((acc, _, index) => ({ ...acc, [`round${index + 1}`]: {} }), {}),
    totalPayment: 0,
    remainingPayment: expectedPerWeek * rounds.length,
  };
  payments.push(newPayment);
  saveData();
  alert("Member Added!");
  exportToCSV(); // Export tables after adding a member
  document.getElementById("memberForm").reset(); // Clear the form
  window.location.href = "rounds.html"; // Redirect to Rounds Page
}

// Function to update the report chart
function updateReportChart() {
  const ctx = document.getElementById("reportChart").getContext("2d");
  if (!ctx) return; // Check if the chart element exists

  if (window.reportChart) {
    window.reportChart.destroy(); // Destroy the existing chart
  }

  window.reportChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: members.map(member => member.name),
      datasets: [{
        label: "Total Payment",
        data: members.map(member => member.totalPayment),
        backgroundColor: "rgba(1, 152, 121, 0.2)", /* Updated theme color */
        borderColor: "rgba(1, 152, 121, 1)", /* Updated theme color */
        borderWidth: 1
      }, {
        label: "Remaining Payment",
        data: members.map(member => member.remainingPayment),
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Function to export tables to CSV
function exportToCSV() {
  let csvContent = "data:text/csv;charset=utf-8,";

  // Export Members Table
  csvContent += "Members Table\n";
  csvContent += "ID,Name,Expected Per Week,Expected Total,Total Payment,Remaining Payment\n";
  members.forEach(member => {
    csvContent += `${member.id},${member.name},${member.expectedPerWeek},${member.expectedPerWeek * rounds.length},${member.totalPayment},${member.remainingPayment}\n`;
  });

  // Export Rounds Table
  csvContent += "\nRounds Table\n";
  csvContent += "ID,Name," + rounds.join(",") + "\n";
  payments.forEach(payment => {
    let row = `${payment.id},${payment.name}`;
    rounds.forEach((round, index) => {
      const roundData = payment[`round${index + 1}`] || {};
      row += `,${roundData.bank ? `${roundData.bank}: ${roundData.amount}` : "-"}`;
    });
    csvContent += row + "\n";
  });

  // Export Remaining Payments Table
  csvContent += "\nRemaining Payments Table\n";
  csvContent += "ID,Name,Expected Total,Remaining Payment\n";
  payments.filter(payment => payment.remainingPayment > 0).forEach(payment => {
    csvContent += `${payment.id},${payment.name},${payment.expectedPerWeek * rounds.length},${payment.remainingPayment}\n`;
  });

  // Create a link and trigger the download
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "ekub_data.csv");
  document.body.appendChild(link);
  link.click();
}

// Function to import data from CSV
function importFromCSV(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const text = e.target.result;
      const rows = text.split("\n");

      // Parse the CSV and update the data
      rows.forEach((row, index) => {
        // Skip the header row (index === 0) and empty rows
        if (index === 0 || row.trim() === "") {
          return;
        }

        const columns = row.split(",");

        // Parse member data
        const id = members.length + 1; // Auto-generate ID to avoid conflicts
        const name = columns[1].trim();
        const expectedPerWeek = parseFloat(columns[2].trim());
        const totalPayment = parseFloat(columns[4].trim());
        const remainingPayment = parseFloat(columns[5].trim());

        // Check if the member already exists (by name or ID)
        const existingMember = members.find(member => member.name === name);
        if (existingMember) {
          alert(`Member "${name}" already exists. Skipping duplicate.`);
          return;
        }

        // Add new member
        const newMember = {
          id,
          name,
          expectedPerWeek,
          totalPayment,
          remainingPayment,
        };
        members.push(newMember);

        // Add corresponding payment
        const newPayment = {
          id,
          name,
          expectedPerWeek,
          totalPayment,
          remainingPayment,
          ...rounds.reduce((acc, _, index) => ({ ...acc, [`round${index + 1}`]: {} }), {}),
        };
        payments.push(newPayment);
      });

      saveData();
      alert("CSV Imported Successfully!");
      populateMembersTable();
      populateRoundsTable();
      populateRemainingPaymentsTable();
      setTimeout(() => updateReportChart(), 0);
    };
    reader.readAsText(file);
  }
}

// Handle form submission (Add Member)
const memberForm = document.getElementById("memberForm");
if (memberForm) {
  memberForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const expectedPerWeek = parseFloat(document.getElementById("expectedPerWeek").value);
    addMember(name, expectedPerWeek);
  });
}

// Handle form submission (Add Round)
const roundForm = document.getElementById("roundForm");
if (roundForm) {
  roundForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const roundDate = document.getElementById("roundDate").value;
    addRound(roundDate);
  });
}

// Initial population of tables
populateMembersTable();
populateRoundsTable();
populateRemainingPaymentsTable();
setTimeout(() => updateReportChart(), 0); // Initialize the report chart

// Add export/import buttons to the home page
const exportButton = document.getElementById("exportButton");
const importButton = document.getElementById("importButton");
const fileInput = document.getElementById("fileInput");
if (exportButton && importButton && fileInput) {
  exportButton.addEventListener("click", exportToCSV);
  importButton.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", importFromCSV);
}
