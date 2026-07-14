const { chromium } = require("playwright");
const path = require("path");
const fs   = require("fs");

(async function() {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: false, slowMo: 0 });
  const ctx     = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page    = await ctx.newPage();

  // Collect console errors
  const errors = [];
  page.on("console", function(msg) {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", function(err) { errors.push("PAGE ERROR: " + err.message); });

  console.log("Navigating to http://localhost:3000/ ...");
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForTimeout(1500);

  // Screenshot 1: Hero
  const ss1 = path.join(process.cwd(), "test-screenshot-01-hero.png");
  await page.screenshot({ path: ss1, fullPage: false });
  console.log("Screenshot 1 saved:", ss1);

  // Scroll to Our Process section
  console.log("Scrolling to Our Process section...");
  await page.evaluate(function() {
    var el = document.getElementById("process-sec");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  });
  await page.waitForTimeout(1500);

  // Screenshot 2: Process section top
  const ss2 = path.join(process.cwd(), "test-screenshot-02-process-top.png");
  await page.screenshot({ path: ss2, fullPage: false });
  console.log("Screenshot 2 saved:", ss2);

  // Check card states BEFORE scroll
  const cardStates = await page.evaluate(function() {
    var sec = document.getElementById("process-sec");
    var con = sec.querySelector(".max-w-5xl");
    var cards = con ? Array.from(con.querySelectorAll(":scope > div")) : [];
    return cards.map(function(c, i) {
      var cs = window.getComputedStyle(c);
      return {
        index: i + 1,
        opacity: cs.opacity,
        transform: cs.transform,
        hasLsaDriven: c.classList.contains("lsa-driven"),
        hasRevealActive: c.classList.contains("reveal-active"),
        inlineTransform: c.style.transform
      };
    });
  });

  console.log("\n=== CARD STATES (at process section top) ===");
  cardStates.forEach(function(s) {
    console.log("Card", s.index + ":", 
      "opacity=" + s.opacity,
      "lsa-driven=" + s.hasLsaDriven,
      "reveal-active=" + s.hasRevealActive,
      "inline-transform=" + (s.inlineTransform || "none"));
  });

  // Scroll slowly through the section (simulate scroll down)
  console.log("\nScrolling through process section...");
  for (var i = 0; i < 12; i++) {
    await page.keyboard.press("PageDown");
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(1000);

  // Screenshot 3: Mid-scroll stacking
  const ss3 = path.join(process.cwd(), "test-screenshot-03-stacking.png");
  await page.screenshot({ path: ss3, fullPage: false });
  console.log("Screenshot 3 saved:", ss3);

  // Check card states DURING scroll
  const cardStatesMid = await page.evaluate(function() {
    var sec = document.getElementById("process-sec");
    var con = sec.querySelector(".max-w-5xl");
    var cards = con ? Array.from(con.querySelectorAll(":scope > div")) : [];
    return cards.map(function(c, i) {
      var cs = window.getComputedStyle(c);
      return {
        index: i + 1,
        opacity: cs.opacity,
        transform: cs.transform.substring(0, 50),
        hasLsaDriven: c.classList.contains("lsa-driven"),
        inlineTransform: c.style.transform
      };
    });
  });

  console.log("\n=== CARD STATES (mid-scroll) ===");
  cardStatesMid.forEach(function(s) {
    console.log("Card", s.index + ":", 
      "opacity=" + s.opacity,
      "lsa-driven=" + s.hasLsaDriven,
      "transform=" + (s.inlineTransform || s.transform).substring(0, 60));
  });

  // Check for errors
  console.log("\n=== CONSOLE ERRORS ===");
  if (errors.length === 0) {
    console.log("No JavaScript errors found!");
  } else {
    errors.forEach(function(e) { console.log("ERROR:", e); });
  }

  // Check if lsa-override style was injected
  const hasOverride = await page.evaluate(function() {
    return !!document.getElementById("lsa-override");
  });
  console.log("\nlsa-override CSS injected:", hasOverride ? "YES - animation running" : "NO - animation may not have started");

  console.log("\nAll screenshots saved. Browser staying open for 5 seconds...");
  await page.waitForTimeout(5000);
  await browser.close();
  console.log("Done.");
})();
