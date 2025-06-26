// ✅ Firebase Config & Init
const firebaseConfig = {
  apiKey: "AIzaSyCDAf4QDPcd4yoxgGWriBzD279pCdyUyws",
  authDomain: "mjcet-attendance-72ca0.firebaseapp.com",
  databaseURL: "https://mjcet-attendance-72ca0-default-rtdb.firebaseio.com",
  projectId: "mjcet-attendance-72ca0",
  storageBucket: "mjcet-attendance-72ca0.appspot.com",
  messagingSenderId: "157073555858",
  appId: "1:157073555858:web:93bae5278c3a7f3758814b",
  measurementId: "G-QKVP2X47RY"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = null;

// 👤 Login
function login() {
  const role = document.getElementById("role").value;
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (!username || !password) return alert("Please fill all fields.");

  document.getElementById("login").style.display = "none";

  if (role === "teacher") {
    document.getElementById("teacherDashboard").style.display = "block";
    alert(`Welcome, ${username}! (Teacher)`);
  } else if (role === "student") {
    document.getElementById("studentDashboard").style.display = "block";
    alert(`Welcome, ${username}! (Student)`);
    generateAttendanceChart(0, 0); // Init chart
  }
}

// 📅 Calendar
function updateCalendar() {
  const calendarGrid = document.getElementById("teacherCalendar");
  const calendarMonthYear = document.getElementById("calendarMonthYear");
  calendarGrid.innerHTML = "";

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  calendarMonthYear.textContent = `${monthNames[currentMonth]} ${currentYear}`;

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const blank = document.createElement("div");
    blank.classList.add("calendar-day");
    blank.style.visibility = "hidden";
    calendarGrid.appendChild(blank);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayDiv = document.createElement("div");
    dayDiv.classList.add("calendar-day");
    dayDiv.textContent = day;
    dayDiv.addEventListener("click", () => {
      selectedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      generateAttendanceForm(selectedDate);
    });
    calendarGrid.appendChild(dayDiv);
  }
}

function changeMonth(direction) {
  currentMonth += direction;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  } else if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  updateCalendar();
}

window.onload = updateCalendar;

// ✅ Generate Attendance Form
function generateAttendanceForm(date) {
  const form = document.getElementById("attendanceForm");
  form.innerHTML = `<h4>Mark Attendance for ${date}</h4>`;

  const students = ["Alice", "Bob", "Charlie", "David"];
  form.attendanceData = {}; // reset

  students.forEach((student) => {
    const row = document.createElement("div");
    row.innerHTML = `
      <label>${student}</label>
      <input type="checkbox" id="${student}" onchange="markStudentAttendance('${student}')">
    `;
    form.appendChild(row);
  });
}

function markStudentAttendance(student) {
  const checkbox = document.getElementById(student);
  const form = document.getElementById("attendanceForm");
  form.attendanceData = form.attendanceData || {};
  form.attendanceData[student] = checkbox.checked;
}

// ✅ Submit to Firestore
async function submitAttendance() {
  const branch = document.getElementById("branchTeacher").value;
  const section = document.getElementById("sectionTeacher").value;
  const date = selectedDate;

  const form = document.getElementById("attendanceForm");
  const attendance = form.attendanceData;

  if (!date || !attendance) return alert("Please select a date and mark attendance.");

  const students = Object.keys(attendance).map(name => ({
    name,
    present: attendance[name]
  }));

  try {
    await db.collection("attendance").add({ date, branch, section, students });
    document.getElementById("attendanceStatus").innerText = `✅ Saved for ${date}`;
  } catch (err) {
    console.error(err);
    document.getElementById("attendanceStatus").innerText = `❌ Failed to save attendance.`;
  }
}

// 📊 Student View
async function viewAttendance() {
  const branch = document.getElementById("branchStudent").value;
  const section = document.getElementById("sectionStudent").value;

  let totalPresent = 0;
  let totalAbsent = 0;

  try {
    const snap = await db.collection("attendance")
      .where("branch", "==", branch)
      .where("section", "==", section)
      .get();

    snap.forEach(doc => {
      doc.data().students.forEach(s => {
        s.present ? totalPresent++ : totalAbsent++;
      });
    });

    document.getElementById("totalPresent").textContent = totalPresent;
    document.getElementById("totalAbsent").textContent = totalAbsent;
    generateAttendanceChart(totalPresent, totalAbsent);
  } catch (e) {
    console.error("Error:", e);
  }
}

// 📈 Chart.js Pie
function generateAttendanceChart(present, absent) {
  const ctx = document.getElementById("attendanceChart").getContext("2d");
  if (window.attendanceChart) window.attendanceChart.destroy();
  window.attendanceChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Present", "Absent"],
      datasets: [{
        data: [present, absent],
        backgroundColor: ["#4caf50", "#e74c3c"]
      }]
    },
    options: {
      responsive: true
    }
  });
}
