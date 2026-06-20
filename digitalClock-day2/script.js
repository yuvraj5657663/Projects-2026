// Multi-alarm clock script (clean file)
const clock = document.getElementById("clock");
const period = document.getElementById("period");
const dateElement = document.getElementById("date");
const greeting = document.getElementById("greeting");
const alarmInput = document.getElementById("alarmTime");
const setAlarmButton = document.getElementById("setAlarm");
const stopAlarmButton = document.getElementById("stopAlarm");
const alarmCount = document.getElementById("alarmCount");
const alarmsList = document.getElementById("alarmsList");
const clearAlarmsButton = document.getElementById("clearAlarms");

const reminderSound = new Audio("./audio/reminder.mp3");
reminderSound.loop = true;

const reminderTimes = [];
let alarmTriggered = false;
let alarmTimeoutId = null;
let lastAlarmMinute = "";
let silenceUntil = "";

function renderAlarms() {
  alarmCount.textContent = reminderTimes.length;
  alarmsList.innerHTML = reminderTimes
    .map((t, i) => `<li>${t}:00 <button data-index="${i}" class="remove-alarm">Remove</button></li>`)
    .join("");
}

function removeAlarm(index) {
  reminderTimes.splice(index, 1);
  renderAlarms();
}

alarmsList.addEventListener("click", (e) => {
  if (e.target.classList.contains("remove-alarm")) {
    const idx = Number(e.target.dataset.index);
    removeAlarm(idx);
  }
});

clearAlarmsButton.addEventListener("click", () => {
  reminderTimes.length = 0;
  stopAlarmSound();
  renderAlarms();
});

function stopAlarmSound() {
  if (!reminderSound.paused) reminderSound.pause();
  reminderSound.currentTime = 0;
  alarmTriggered = false;
  silenceUntil = lastAlarmMinute;
  if (alarmTimeoutId) {
    clearTimeout(alarmTimeoutId);
    alarmTimeoutId = null;
  }
}

function setAlarm() {
  const timeRaw = (alarmInput.value || "").trim();
  if (!timeRaw) return;
  const parts = timeRaw.split(":");
  if (parts.length < 2) return;
  const normalized = `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
  if (!reminderTimes.includes(normalized)) {
    reminderTimes.push(normalized);
    reminderTimes.sort();
  }
  alarmInput.value = "";
  renderAlarms();
}

setAlarmButton.addEventListener("click", setAlarm);
stopAlarmButton.addEventListener("click", stopAlarmSound);

function updateClock() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const ampm = hours >= 12 ? "PM" : "AM";
  let displayHours = hours % 12 || 12;
  const displayMinutes = String(minutes).padStart(2, "0");
  const displaySeconds = String(seconds).padStart(2, "0");
  displayHours = String(displayHours).padStart(2, "0");

  clock.textContent = `${displayHours}:${displayMinutes}:${displaySeconds}`;

  const day = now.getDate();
  const month = now.toLocaleString("default", { month: "long" });
  const year = now.getFullYear();

  const hours24 = String(hours).padStart(2, "0");
  const currentTimeHM = `${hours24}:${displayMinutes}`;

  if (currentTimeHM !== lastAlarmMinute) {
    alarmTriggered = false;
    silenceUntil = "";
    lastAlarmMinute = currentTimeHM;
  }

  if (reminderTimes.includes(currentTimeHM) && !alarmTriggered && currentTimeHM !== silenceUntil) {
    reminderSound.play();
    alarmTriggered = true;
    alarmTimeoutId = setTimeout(() => stopAlarmSound(), 5 * 60 * 1000);
  }

  const currentHour = hours;
  let message = "";
  if (currentHour < 12) message = "Good Morning";
  else if (currentHour < 17) message = "Good Afternoon";
  else if (currentHour < 22) message = "Good Evening";
  else message = "Good Night";

  greeting.textContent = message;
  dateElement.textContent = `${day} ${month} ${year}`;
  period.textContent = ampm;
}

renderAlarms();
updateClock();
setInterval(updateClock, 1000);
