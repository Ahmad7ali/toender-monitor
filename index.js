const puppeteer = require("puppeteer");
const axios = require("axios");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const URL =
  "https://reservation.frontdesksuite.com/toender/vielse/ReserveTime/TimeSelection?pageId=8d47364a-5e21-4e40-892d-e9f46878e18b&buttonId=9d98558f-9d2e-4a50-8124-adf00b4abfb0&culture=en";

const CHECK_INTERVAL = 30000;

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
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0 Safari/537.36"
    );

    await page.goto(URL, {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    const html = await page.content();

    console.log("Seite geladen.");

    const hasError = html.includes("FlowStateIsMissing");

    if (hasError) {
      console.log("FlowState fehlt.");
    }

    const hasAppointment =
      html.includes("Choose time") ||
      html.includes("Available") ||
      html.includes("Book");

    if (hasAppointment && !hasError) {
      if (lastState !== "open") {
        await sendTelegram(
          "🚨 TØNDER ALARM!\n\nEs könnte ein Termin verfügbar sein!\n\n" + URL
        );
        console.log("Termin gefunden!");
      }
      lastState = "open";
    } else {
      console.log("Noch keine Termine.");
      lastState = "closed";
    }

    await browser.close();
  } catch (err) {
    console.error(err);

    if (browser) {
      await browser.close();
    }
  }
}

console.log("Toender Monitor gestartet...");

checkAppointments();
setInterval(checkAppointments, CHECK_INTERVAL);
