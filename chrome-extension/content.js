// Runs on the CRM's /crm/* pages. Turns phone numbers into one-click dials:
// clicking a `tel:` link (the CRM already renders these) or a plain-text
// number opens the dialer with it prefilled, instead of handing off to the OS.

const PHONE_RE = /(?<!\d)(\+?\d[\d ().\-]{6,}\d)(?!\d)/g;
const PHONE_TEST = /(?<!\d)\+?\d[\d ().\-]{6,}\d(?!\d)/; // non-global — safe for .test()

function dial(number) {
  const clean = String(number).replace(/[^\d+]/g, "");
  if (clean.replace(/\D/g, "").length < 6) return;
  chrome.runtime.sendMessage({ type: "dial-from-page", number: clean });
}

// 1) tel: links — capture-phase so we beat the CRM's own handler.
document.addEventListener(
  "click",
  (e) => {
    const a = e.target.closest && e.target.closest('a[href^="tel:"]');
    if (!a) return;
    e.preventDefault();
    e.stopPropagation();
    dial(decodeURIComponent(a.getAttribute("href").slice(4)));
  },
  true,
);

// 2) plain-text numbers — wrap them in a subtle clickable chip. Conservative:
//    skips anything already inside a link, input, or the wrapper we add, and
//    re-runs (debounced) as the CRM re-renders.
const WRAP_CLASS = "fs-dialer-num";

function wrapNumbersIn(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !/\d/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
      const p = node.parentElement;
      if (!p) return NodeFilter.FILTER_REJECT;
      if (p.closest(`a, input, textarea, button, select, script, style, .${WRAP_CLASS}`))
        return NodeFilter.FILTER_REJECT;
      return PHONE_TEST.test(node.nodeValue)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  const targets = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) targets.push(n);

  for (const node of targets) {
    PHONE_RE.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let last = 0;
    let m;
    const text = node.nodeValue;
    while ((m = PHONE_RE.exec(text))) {
      const num = m[1];
      frag.append(text.slice(last, m.index));
      const chip = document.createElement("span");
      chip.className = WRAP_CLASS;
      chip.textContent = num;
      chip.setAttribute("role", "button");
      chip.tabIndex = 0;
      chip.title = "Call with Flow State Dialer";
      chip.style.cssText =
        "cursor:pointer;border-bottom:1px dashed rgba(0,200,240,.6);color:inherit";
      chip.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        dial(num);
      });
      frag.append(chip);
      last = m.index + m[0].length;
    }
    frag.append(text.slice(last));
    node.parentNode.replaceChild(frag, node);
  }
}

let scheduled = false;
function scheduleScan() {
  if (scheduled) return;
  scheduled = true;
  setTimeout(() => {
    scheduled = false;
    try {
      wrapNumbersIn(document.body);
    } catch {}
  }, 400);
}

try {
  wrapNumbersIn(document.body);
  new MutationObserver(scheduleScan).observe(document.body, {
    childList: true,
    subtree: true,
  });
} catch {}
