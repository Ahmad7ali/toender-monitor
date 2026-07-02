const axios = require("axios");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const URL =
  "https://reservation.frontdesksuite.com/toender/vielse/ReserveTime/TimeSelection?pageId=8d47364a-5e21-4e40-892d-e9f46878e18b&buttonId=9d98558f-9d2e-4a50-8124-adf00b4abfb0&culture=en";

const CHECK_INTERVAL = 30000; // 30 Sekunden

async function sendTelegram(message) {
  await axios.post(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      chat_id: CHAT_ID,
      text: message,
    }
  );
}

let lastState = null;

async function checkAppointments() {
  try {
    const response = await axios.get(URL, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    const html = response.data;
    const isClosed = html.includes("Not open for booking");

    if (!isClosed) {
      if (lastState !== "open") {
        await sendTelegram(
          "🚨 TØNDER ALARM!\n\nEin Termin könnte verfügbar sein!\n\n" + URL
        );
        console.log("Termin gefunden!");
      }
      lastState = "open";
    } else {
      console.log("Noch keine Termine.");
      lastState = "closed";
    }
  } catch (err) {
    console.error("Fehler:", err.message);
  }
}

checkAppointments();
setInterval(checkAppointments, CHECK_INTERVAL);
