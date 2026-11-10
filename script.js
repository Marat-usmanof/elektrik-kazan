// Обновлённый калькулятор и галерея для сайта «Электрик Казань»
const quantities = Object.create(null);
const phone = "79520383777";
const displayPhone = "+7 (952) 038-37-77";

function priceFor(item) {
  // Согласованные значения: минимальный заказ 2 000 ₽, проектирование от 170 ₽/м².
  if (/Минимальный заказ/i.test(item[0])) return 2000;
  return item[2];
}
function parsePrice(value) {
  if (typeof value === "number") return { value, from: false };
  const text = String(value).trim();
  if (/%|по месту|—/i.test(text)) return null;
  const match = text.replace(/\s/g, "").match(/\d+(?:[.,]\d+)?/);
  if (!match) return null;
  return { value: Number(match[0].replace(",", ".")), from: /от|–|-/i.test(text) };
}
function money(value) {
  return Number(value || 0).toLocaleString("ru-RU") + "\u00A0₽";
}
function safe(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}
function render(query = "") {
  const q = query.toLocaleLowerCase("ru").trim();
  const root = document.getElementById("priceTables");
  let html = "";
  PRICE_DATA.forEach((group, gi) => {
    const items = group.items.map((item, ii) => ({ item, ii }))
      .filter(({ item }) => !q ||
        item[0].toLocaleLowerCase("ru").includes(q) ||
        group.title.toLocaleLowerCase("ru").includes(q));
    if (!items.length) return;
    html += `<section class="price-group">
      <h3 tabindex="0" role="button" aria-expanded="${q ? "true" : "false"}">${safe(group.title)} <span class="price-group-count">${items.length} поз.</span></h3>
      <div class="price-table-scroll" ${q ? "" : "hidden"}>
        <table><thead><tr><th>Работа</th><th>Ед. изм.</th><th>Цена</th><th>Кол-во</th></tr></thead><tbody>`;
    items.forEach(({ item, ii }) => {
      const key = gi + "-" + ii;
      const parsed = parsePrice(priceFor(item));
      const qty = quantities[key] || "";
      const price = typeof priceFor(item) === "number" ? money(priceFor(item)) : safe(priceFor(item));
      const input = parsed
        ? `<input class="qty-input" type="number" min="0" max="9999" step="1" inputmode="numeric" data-key="${key}" value="${qty}" placeholder="0" aria-label="Количество для ${safe(item[0])}">`
        : `<span class="not-calculated">по запросу</span>`;
      html += `<tr><td>${safe(item[0])}</td><td>${safe(item[1])}</td><td class="price">${price}</td><td>${input}</td></tr>`;
    });
    html += "</tbody></table></div></section>";
  });
  root.innerHTML = html || "<p class='empty-result'>Ничего не найдено. Попробуйте изменить запрос.</p>";

  root.querySelectorAll(".price-group h3").forEach(heading => {
    const section = heading.parentElement;
    const table = section.querySelector(".price-table-scroll");
    const toggle = () => {
      const open = section.classList.toggle("open");
      table.hidden = !open;
      heading.setAttribute("aria-expanded", String(open));
    };
    heading.addEventListener("click", toggle);
    heading.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    });
  });
  root.querySelectorAll(".qty-input").forEach(input => input.addEventListener("input", () => {
    const value = Math.max(0, Math.min(9999, parseInt(input.value, 10) || 0));
    if (value) quantities[input.dataset.key] = value;
    else delete quantities[input.dataset.key];
    updateCalc();
  }));
  updateCalc();
}
function selectedItems() {
  return Object.entries(quantities).map(([key, qty]) => {
    const [gi, ii] = key.split("-").map(Number);
    const item = PRICE_DATA[gi]?.items[ii];
    return item ? { item, qty, parsed: parsePrice(priceFor(item)) } : null;
  }).filter(Boolean);
}
function totals() {
  const rows = selectedItems();
  let sum = 0, count = 0, hasFrom = false, unpriced = 0;
  rows.forEach(({ qty, parsed }) => {
    count += qty;
    if (parsed) {
      sum += parsed.value * qty;
      if (parsed.from) hasFrom = true;
    } else unpriced += qty;
  });
  return { rows, sum, count, hasFrom, unpriced };
}
function buildQuote() {
  const t = totals();
  const lines = ["Здравствуйте! Прошу рассчитать стоимость электромонтажных работ:", ""];
  t.rows.forEach(({ item, qty, parsed }) => {
    if (!parsed) {
      lines.push(`• ${item[0]} — ${qty} ${item[1]} (стоимость уточняется)`);
      return;
    }
    lines.push(`• ${item[0]} — ${qty} ${item[1]} × ${money(parsed.value)}${parsed.from ? " (от)" : ""} = ${money(parsed.value * qty)}`);
  });
  lines.push("", `Предварительный итог: ${t.hasFrom ? "от " : ""}${money(t.sum)}`);
  if (t.unpriced) lines.push(`Позиций с индивидуальной стоимостью: ${t.unpriced}`);
  lines.push("Минимальный заказ: 2 000 ₽", "", `Марат Усманов · ${displayPhone}`);
  return lines.join("\n");
}
function updateCalc() {
  const t = totals();
  const count = document.getElementById("calcCount");
  const total = document.getElementById("calcTotal");
  if (count) count.textContent = t.count;
  if (total) total.textContent = (t.hasFrom ? "от " : "") + money(t.sum);
}
function makePrintSheet() {
  let sheet = document.getElementById("printSheet");
  if (!sheet) {
    sheet = document.createElement("section");
    sheet.id = "printSheet";
    sheet.className = "print-sheet";
    sheet.innerHTML = `<h1>Предварительная смета</h1>
      <p>Электромонтажные работы · Марат Усманов · ${displayPhone}</p>
      <div id="printQuote"></div><strong id="printTotal"></strong>
      <small>Расчёт предварительный. Точная стоимость согласуется после уточнения условий объекта.</small>`;
    document.body.appendChild(sheet);
  }
  return sheet;
}
function printQuote() {
  const t = totals();
  if (!t.count) { alert("Сначала добавьте работы в расчёт."); return; }
  makePrintSheet();
  document.getElementById("printQuote").innerHTML =
    `<table><thead><tr><th>Работа</th><th>Количество</th><th>Цена</th><th>Сумма</th></tr></thead><tbody>` +
    t.rows.map(({ item, qty, parsed }) =>
      `<tr><td>${safe(item[0])}</td><td>${qty} ${safe(item[1])}</td>` +
      `<td>${parsed ? (parsed.from ? "от " : "") + money(parsed.value) : "по запросу"}</td>` +
      `<td>${parsed ? money(parsed.value * qty) : "уточняется"}</td></tr>`).join("") +
    `</tbody></table>`;
  document.getElementById("printTotal").textContent =
    `Предварительный итог: ${t.hasFrom ? "от " : ""}${money(t.sum)}` +
    (t.unpriced ? " · часть работ рассчитывается отдельно" : "");
  window.print();
}

/* ===== PDF-смета: создаётся прямо в браузере и отправляется через «Поделиться» ===== */
function pdfPages() {
  const t = totals();
  const W = 1240, H = 1754, M = 90;               // A4, ~150 dpi
  const FONT = '"Segoe UI", Roboto, Arial, sans-serif';
  const X = { qty: 630, price: 950, sum: W - M, nameW: 500 };
  const pages = [];
  let canvas, ctx, y;

  function wrap(text, maxW) {
    const words = String(text).split(/\s+/), lines = [];
    let line = "";
    words.forEach(word => {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word; }
      else line = test;
    });
    if (line) lines.push(line);
    return lines;
  }
  function head() {
    ctx.fillStyle = "#87939d";
    ctx.font = "bold 20px " + FONT;
    ctx.textAlign = "left";  ctx.fillText("РАБОТА", M, y);
    ctx.fillText("КОЛ-ВО", X.qty, y);
    ctx.textAlign = "right"; ctx.fillText("ЦЕНА", X.price, y); ctx.fillText("СУММА", X.sum, y);
    ctx.textAlign = "left";
    ctx.fillStyle = "#c9d1d8"; ctx.fillRect(M, y + 14, W - 2 * M, 2);
    y += 48;
  }
  function newPage(first) {
    canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);
    y = M + 30;
    if (first) {
      ctx.fillStyle = "#172633"; ctx.font = "bold 46px " + FONT;
      ctx.fillText("Предварительная смета", M, y); y += 44;
      ctx.fillStyle = "#4f5d68"; ctx.font = "26px " + FONT;
      ctx.fillText("Электромонтажные работы · Марат Усманов · " + displayPhone, M, y); y += 36;
      ctx.fillText("Дата: " + new Date().toLocaleDateString("ru-RU"), M, y); y += 56;
    }
    head();
    pages.push(canvas);
  }

  newPage(true);
  t.rows.forEach(({ item, qty, parsed }) => {
    ctx.font = "24px " + FONT;
    const lines = wrap(item[0], X.nameW);
    const rowH = lines.length * 32 + 24;
    if (y + rowH > H - M - 220) newPage(false);
    ctx.font = "24px " + FONT;
    ctx.fillStyle = "#172633";
    lines.forEach((ln, i) => ctx.fillText(ln, M, y + i * 32));
    ctx.fillText(qty + " " + item[1], X.qty, y);
    ctx.textAlign = "right";
    ctx.fillText(parsed ? (parsed.from ? "от " : "") + money(parsed.value) : "по запросу", X.price, y);
    ctx.font = "bold 24px " + FONT;
    ctx.fillText(parsed ? (parsed.from ? "от " : "") + money(parsed.value * qty) : "уточняется", X.sum, y);
    ctx.textAlign = "left";
    ctx.fillStyle = "#edf0f2"; ctx.fillRect(M, y + rowH - 26, W - 2 * M, 2);
    y += rowH;
  });

  if (y > H - M - 200) newPage(false);
  y += 30;
  ctx.fillStyle = "#172633"; ctx.font = "bold 36px " + FONT;
  ctx.fillText("Предварительный итог: " + (t.hasFrom ? "от " : "") + money(t.sum), M, y); y += 44;
  ctx.font = "24px " + FONT; ctx.fillStyle = "#4f5d68";
  if (t.unpriced) { ctx.fillText("Часть работ рассчитывается отдельно.", M, y); y += 34; }
  ctx.fillText("Минимальный заказ: 2 000 ₽", M, y); y += 44;
  ctx.font = "22px " + FONT; ctx.fillStyle = "#788590";
  wrap("Расчёт предварительный. Точная стоимость согласуется после уточнения условий объекта.", W - 2 * M)
    .forEach(ln => { ctx.fillText(ln, M, y); y += 30; });

  return pages.map(c => {
    const bin = atob(c.toDataURL("image/jpeg", 0.92).split(",")[1]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { jpg: bytes, w: c.width, h: c.height };
  });
}
function buildPdf(pages) {
  const enc = new TextEncoder(), chunks = [], offsets = [];
  let len = 0;
  const push = d => { const u = typeof d === "string" ? enc.encode(d) : d; chunks.push(u); len += u.length; };
  const obj = (id, body) => { offsets[id] = len; push(`${id} 0 obj\n${body}\nendobj\n`); };
  const n = pages.length;
  push("%PDF-1.4\n");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, `<< /Type /Pages /Kids [${pages.map((_, i) => (3 + 3 * i) + " 0 R").join(" ")}] /Count ${n} >>`);
  pages.forEach((p, i) => {
    const pid = 3 + 3 * i, cid = pid + 1, iid = pid + 2;
    const content = "q 595.28 0 0 841.89 0 0 cm /Im0 Do Q";
    obj(pid, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ${iid} 0 R >> >> /Contents ${cid} 0 R >>`);
    obj(cid, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    offsets[iid] = len;
    push(`${iid} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpg.length} >>\nstream\n`);
    push(p.jpg);
    push("\nendstream\nendobj\n");
  });
  const total = 3 * n + 3, xrefPos = len;
  let x = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let id = 1; id < total; id++) x += String(offsets[id]).padStart(10, "0") + " 00000 n \n";
  push(x + `trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`);
  return new Blob(chunks, { type: "application/pdf" });
}
async function sharePdf() {
  if (!totals().count) { alert("Сначала выберите работы."); return; }
  const btn = document.getElementById("calcPdf");
  const label = btn ? btn.textContent : "";
  if (btn) { btn.disabled = true; btn.textContent = "…"; }
  try {
    const blob = buildPdf(pdfPages());
    const file = new File([blob], "smeta-elektromontazh.pdf", { type: "application/pdf" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "Предварительная смета", text: "Предварительная смета на электромонтажные работы" });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = file.name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  } catch (err) {
    if (!err || err.name !== "AbortError") { alert("Не удалось создать PDF."); console.error(err); }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = label; }
  }
}
function initCalculator() {
  const search = document.getElementById("priceSearch");
  if (search) search.addEventListener("input", event => render(event.target.value));

  const mailButton = document.getElementById("calcMail");
  if (mailButton) {
    mailButton.textContent = "💬 WhatsApp";
    mailButton.title = "Отправить расчёт в WhatsApp";
    mailButton.addEventListener("click", () => {
      if (!totals().count) { alert("Сначала выберите работы."); return; }
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(buildQuote())}`, "_blank", "noopener");
    });
  }
  const controls = document.querySelector(".calc-btns");
  if (controls && !document.getElementById("calcPrint")) {
    const print = document.createElement("button");
    print.type = "button";
    print.id = "calcPrint";
    print.className = "btn btn--sm";
    print.textContent = "🖨 Смета";
    print.title = "Скачать / распечатать смету";
    print.addEventListener("click", printQuote);
    controls.insertBefore(print, controls.children[1] || null);
  } else {
    document.getElementById("calcPrint")?.addEventListener("click", printQuote);
  }
  document.getElementById("calcPdf")?.addEventListener("click", sharePdf);
  document.getElementById("calcReset")?.addEventListener("click", () => {
    Object.keys(quantities).forEach(key => delete quantities[key]);
    document.querySelectorAll(".qty-input").forEach(input => input.value = "");
    updateCalc();
  });
  render();
}
function initGallery() {
  const figures = [...document.querySelectorAll(".gallery-grid figure")];
  const box = document.getElementById("lightbox");
  if (!figures.length || !box) return;
  const image = document.getElementById("lbImg");
  const counter = document.getElementById("lbCount");
  let current = 0;
  function show(index) {
    current = (index + figures.length) % figures.length;
    image.src = figures[current].dataset.full;
    counter.textContent = `${current + 1} / ${figures.length}`;
  }
  function close() {
    box.classList.remove("open");
    document.body.style.overflow = "";
  }
  figures.forEach((figure, index) => figure.addEventListener("click", () => {
    show(index);
    box.classList.add("open");
    document.body.style.overflow = "hidden";
  }));
  document.getElementById("lbClose")?.addEventListener("click", close);
  document.getElementById("lbPrev")?.addEventListener("click", () => show(current - 1));
  document.getElementById("lbNext")?.addEventListener("click", () => show(current + 1));
  box.addEventListener("click", event => { if (event.target === box) close(); });
  document.addEventListener("keydown", event => {
    if (!box.classList.contains("open")) return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") show(current - 1);
    if (event.key === "ArrowRight") show(current + 1);
  });
}
function initMenu() {
  const menu = document.getElementById("menu");
  if (!menu) return;
  menu.querySelectorAll("a").forEach(link =>
    link.addEventListener("click", () => menu.removeAttribute("open")));
  document.addEventListener("click", event => {
    if (menu.open && !menu.contains(event.target)) menu.removeAttribute("open");
  });
}
document.addEventListener("DOMContentLoaded", () => {
  initCalculator();
  initGallery();
  initMenu();
});
