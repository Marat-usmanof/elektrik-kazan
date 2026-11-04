function fmtPrice(v){
  if(typeof v === "number") return v.toLocaleString("ru-RU") + " ₽";
  return String(v);
}
function parsePrice(v){
  // извлекает число из "460", "от 22500", "800–1200" (берёт минимум), "10% от стоимости" (null)
  if(typeof v === "number") return {val:v, from:false};
  const s = String(v);
  if(s.includes("%") || s.toLowerCase().includes("по месту") || s === "—") return null;
  const m = s.replace(/\s/g,"").match(/\d+/);
  if(!m) return null;
  return {val:parseInt(m[0],10), from:s.toLowerCase().includes("от") || s.includes("–")};
}

const quantities = {}; // ключ "группа-индекс" -> количество

function render(q){
  q = (q||"").toLowerCase().trim();
  const root = document.getElementById("priceTables");
  let html = "", total = 0;
  PRICE_DATA.forEach((group, gi)=>{
    const items = group.items
      .map((it, ii)=>({it, ii}))
      .filter(o => !q || o.it[0].toLowerCase().includes(q) || group.title.toLowerCase().includes(q));
    if(!items.length) return;
    total += items.length;
    html += `<div class="price-group"><h3>${group.title}</h3><table><thead><tr><th>Работа</th><th>Ед. изм.</th><th>Цена</th><th>Кол-во</th></tr></thead><tbody>`;
    items.forEach(o=>{
      const key = gi + "-" + o.ii;
      const qty = quantities[key] || "";
      const parsed = parsePrice(o.it[2]);
      const qtyCell = parsed
        ? `<input class="qty-input" type="number" min="0" step="1" inputmode="numeric" data-key="${key}" value="${qty}" placeholder="0" aria-label="Количество">`
        : `<span style="color:var(--muted);font-size:.85rem">по запросу</span>`;
      html += `<tr><td>${o.it[0]}</td><td>${o.it[1]}</td><td class="price">${fmtPrice(o.it[2])}</td><td class="qty-cell">${qtyCell}</td></tr>`;
    });
    html += `</tbody></table></div>`;
  });
  if(!total) html = "<p style='color:var(--muted)'>Ничего не найдено. Попробуйте другой запрос.</p>";
  root.innerHTML = html;

  root.querySelectorAll(".qty-input").forEach(inp=>{
    inp.addEventListener("input", ()=>{
      const v = parseInt(inp.value, 10);
      if(v > 0) quantities[inp.dataset.key] = v; else delete quantities[inp.dataset.key];
      updateCalc();
    });
  });
  updateCalc();
}

function calcTotals(){
  let sum = 0, count = 0, hasFrom = false;
  for(const key in quantities){
    const [gi, ii] = key.split("-").map(Number);
    const item = PRICE_DATA[gi] && PRICE_DATA[gi].items[ii];
    if(!item) continue;
    const parsed = parsePrice(item[2]);
    if(!parsed) continue;
    sum += parsed.val * quantities[key];
    count += quantities[key];
    if(parsed.from) hasFrom = true;
  }
  return {sum, count, hasFrom};
}

function updateCalc(){
  const {sum, count, hasFrom} = calcTotals();
  document.getElementById("calcCount").textContent = count;
  document.getElementById("calcTotal").textContent = (hasFrom ? "от " : "") + sum.toLocaleString("ru-RU") + " ₽";
}

function buildCalcText(){
  const lines = ["Здравствуйте! Прошу рассчитать стоимость работ:", ""];
  let sum = 0, hasFrom = false;
  for(const key in quantities){
    const [gi, ii] = key.split("-").map(Number);
    const item = PRICE_DATA[gi] && PRICE_DATA[gi].items[ii];
    if(!item) continue;
    const parsed = parsePrice(item[2]);
    if(!parsed) continue;
    const qty = quantities[key];
    const lineSum = parsed.val * qty;
    sum += lineSum;
    if(parsed.from) hasFrom = true;
    lines.push("• " + item[0] + " — " + qty + " " + item[1] + " × " + parsed.val.toLocaleString("ru-RU") + " ₽ = " + lineSum.toLocaleString("ru-RU") + " ₽");
  }
  lines.push("", "ИТОГО" + (hasFrom ? " (предварительно, от)" : "") + ": " + sum.toLocaleString("ru-RU") + " ₽");
  lines.push("", "Электромонтажные работы в Казани");
  lines.push("Усманов Марат Раисович, 8 (952) 03-83-77-7");
  return lines.join("\n");
}

document.getElementById("calcMail").addEventListener("click", ()=>{
  const {count} = calcTotals();
  if(!count){ alert("Сначала введите количество хотя бы для одной работы."); return; }
  const body = encodeURIComponent(buildCalcText());
  const subject = encodeURIComponent("Расчёт электромонтажных работ — " + calcTotals().sum.toLocaleString("ru-RU") + " ₽");
  window.location.href = "mailto:?subject=" + subject + "&body=" + body;
});

document.getElementById("calcCopy").addEventListener("click", async ()=>{
  const {count} = calcTotals();
  if(!count){ alert("Сначала введите количество хотя бы для одной работы."); return; }
  try{
    await navigator.clipboard.writeText(buildCalcText());
    alert("Расчёт скопирован — вставьте в любой чат или документ.");
  }catch(e){
    alert("Не удалось скопировать автоматически. Выделите текст вручную.");
  }
});

document.getElementById("calcReset").addEventListener("click", ()=>{
  for(const k in quantities) delete quantities[k];
  document.querySelectorAll(".qty-input").forEach(i=> i.value = "");
  updateCalc();
});

document.getElementById("priceSearch").addEventListener("input", e => render(e.target.value));
render("");

// ===== Галерея-лайтбокс =====
(function(){
  const figs = Array.from(document.querySelectorAll(".gallery-grid figure"));
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lbImg");
  const lbCount = document.getElementById("lbCount");
  let cur = 0;

  function show(i){
    cur = (i + figs.length) % figs.length;
    lbImg.src = figs[cur].dataset.full;
    lbCount.textContent = (cur+1) + " / " + figs.length;
  }
  function open(i){ show(i); lb.classList.add("open"); document.body.style.overflow = "hidden"; }
  function close(){ lb.classList.remove("open"); document.body.style.overflow = ""; }

  figs.forEach((f,i)=> f.addEventListener("click", ()=>open(i)));
  document.getElementById("lbClose").addEventListener("click", close);
  document.getElementById("lbPrev").addEventListener("click", e=>{e.stopPropagation(); show(cur-1);});
  document.getElementById("lbNext").addEventListener("click", e=>{e.stopPropagation(); show(cur+1);});
  lb.addEventListener("click", e=>{ if(e.target === lb) close(); });
  document.addEventListener("keydown", e=>{
    if(!lb.classList.contains("open")) return;
    if(e.key === "Escape") close();
    if(e.key === "ArrowLeft") show(cur-1);
    if(e.key === "ArrowRight") show(cur+1);
  });
})();
