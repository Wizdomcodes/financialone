/* ===========================
   STORAGE HELPERS
=========================== */

function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function getLoggedInUser() {
  return JSON.parse(sessionStorage.getItem("loggedInUser"));
}

function updateLoggedInUser(user) {
  sessionStorage.setItem("loggedInUser", JSON.stringify(user));

  const users = getUsers();
  const index = users.findIndex(u => u.username === user.username);
  if (index !== -1) {
    users[index] = user;
    saveUsers(users);
  }
}

/* ===========================
   LOGIN MODAL
=========================== */

function openLogin() {
  document.getElementById("loginModal").style.display = "flex";
}

function closeLogin() {
  document.getElementById("loginModal").style.display = "none";
}

/* ===========================
   LOGIN
=========================== */

function login(event) {
  event.preventDefault();

  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  const users = getUsers();
  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    alert("Invalid username or password");
    return;
  }

  sessionStorage.setItem("loggedInUser", JSON.stringify(user));
  window.location.href = "dashboard.html";
}

/* ===========================
   SIGNUP
=========================== */

function signup(event) {
  event.preventDefault();

  const fullName = document.getElementById("fullName").value;
  const email = document.getElementById("email").value;
  const username = document.getElementById("signupUsername").value;
  const password = document.getElementById("signupPassword").value;
  const pin = document.getElementById("signupPin").value;

  if (!/^\d{4}$/.test(pin)) {
    alert("PIN must be exactly 4 digits");
    return;
  }

  const users = getUsers();
  if (users.find(u => u.username === username)) {
    alert("Username already exists");
    return;
  }

  const newUser = {
    fullName,
    email,
    username,
    password,
    pin,
    accountNumber: "30" + Math.floor(1000000000 + Math.random() * 9000000000),
    balance: 200000,          // CHECKING balance
    savingsBalance: 0,        // SAVINGS balance
    transactions: []
  };

  users.push(newUser);
  saveUsers(users);

  alert("Account created successfully");
  window.location.href = "login.html";
}

const FIXED_OTP = "642786";
let pendingSignupUser = null;

function signup(event) {
  event.preventDefault();

  const fullName = document.getElementById("fullName").value;
  const email = document.getElementById("email").value;
  const username = document.getElementById("signupUsername").value;
  const password = document.getElementById("signupPassword").value;
  const pin = document.getElementById("signupPin").value;

  if (!/^\d{4}$/.test(pin)) {
    alert("PIN must be 4 digits");
    return;
  }

  const users = getUsers();
  if (users.find(u => u.username === username)) {
    alert("Username already exists");
    return;
  }

  pendingSignupUser = {
    fullName,
    email,
    username,
    password,
    pin,
    accountNumber: "30" + Math.floor(1000000000 + Math.random() * 9000000000),
    balance: 200000,
    savingsBalance: 0,
    transactions: []
  };

  sessionStorage.setItem("signupOTP", FIXED_OTP);

  document.getElementById("otpModal").style.display = "flex";
  document.getElementById("otpMessage").innerHTML = `
    <strong>Your OTP code:</strong><br>
    <span style="font-size:24px;color:#d6001c">${FIXED_OTP}</span>
  `;
}

function verifyOTP(event) {
  event.preventDefault();

  const enteredOTP = document.getElementById("otpInput").value.trim();
  const savedOTP = sessionStorage.getItem("signupOTP");

  if (enteredOTP !== savedOTP) {
    alert("Invalid OTP");
    return;
  }

  const users = getUsers();
  users.push(pendingSignupUser);
  saveUsers(users);

  sessionStorage.removeItem("signupOTP");
  pendingSignupUser = null;

  alert("Account created successfully");
  window.location.href = "login.html";
}

/* ===========================
   DASHBOARD LOAD
=========================== */

if (window.location.pathname.includes("dashboard.html")) {
  const user = getLoggedInUser();

  if (!user) {
    window.location.href = "login.html";
  } else {
    document.getElementById("userDisplay").textContent = user.fullName;

    document.getElementById("checkingAcct").textContent =
      "•••• " + user.accountNumber.slice(-4);

    document.getElementById("savingsAcct").textContent =
      "•••• " + (Number(user.accountNumber.slice(-4)) + 1);

    updateAccountDisplays(user);
    renderActivity(user.transactions);
  }
}

/* ===========================
   BALANCE DISPLAY
=========================== */

function updateAccountDisplays(user) {
  document.getElementById("checkingBalance").textContent =
    `$${user.balance.toFixed(2)}`;

  document.getElementById("savingsBalance").textContent =
    `$${user.savingsBalance.toFixed(2)}`;
}

/* ===========================
   TRANSFER + PIN
=========================== */

let pendingTransfer = null;

function confirmTransfer() {
  const bank = document.getElementById("bank").value;
  const name = document.getElementById("beneficiary").value;
  const acct = document.getElementById("accountNumber").value;
  const routing = document.getElementById("routingNumber").value;
  const amount = parseFloat(document.getElementById("transferAmount").value);
  const note = document.getElementById("transferNote").value;

  if (!bank || !name || !acct || !routing || !amount) {
    alert("Please complete all fields");
    return;
  }

  pendingTransfer = { bank, name, amount, note };

  document.getElementById("transferModal").style.display = "none";
  document.getElementById("pinModal").style.display = "flex";
}

function verifyPin() {
  const enteredPin = document.getElementById("pinInput").value;
  const user = getLoggedInUser();

  if (enteredPin !== user.pin) {
    alert("Invalid PIN");
    return;
  }

  processTransfer(user);
  document.getElementById("pinModal").style.display = "none";
  document.getElementById("pinInput").value = "";
}

let transferSource = "checking";

function transferFrom(type) {
  transferSource = type;
  document.getElementById("transferModal").style.display = "flex";
}

function closeTransfer() {
  document.getElementById("transferModal").style.display = "none";
}

/* ===========================
   PROCESS TRANSFER
=========================== */

function processTransfer(user) {
  const { name, amount } = pendingTransfer;

  if (amount > user.balance) {
    alert("Insufficient funds");
    return;
  }

  user.balance -= amount;

  user.transactions.unshift({
    text: `Transfer to ${name} - $${amount.toFixed(2)}`,
    time: new Date().toLocaleString(),
    type: "debit"
  });

  updateLoggedInUser(user);
  updateAccountDisplays(user);
  renderActivity(user.transactions);

  alert("Transfer successful");
  pendingTransfer = null;
}

/* ===========================
   ACTIVITY
=========================== */

function renderActivity(list) {
  const ul = document.getElementById("activityList");
  if (!ul) return;

  ul.innerHTML = "";

  list.slice(0, 6).forEach(item => {
    const li = document.createElement("li");
    li.className = item.type;
    li.innerHTML = `
      <span>${item.text}</span>
      <small>${item.time}</small>
    `;
    ul.appendChild(li);
  });
}

/* ===========================
   LOGOUT
=========================== */

function logout() {
  sessionStorage.clear();
  window.location.href = "login.html";
}
