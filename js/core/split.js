// Minimal text splitter: wraps words (and every CJK character) in masked spans so they can
// slide up from under a clip. Keeps the original text in aria-label for screen readers.
const CJK = /[぀-ヿ㐀-鿿豈-﫿　-〿＀-￯]/;

export function split(el, { chars = false } = {}) {
  if (!el || el.dataset.split) return el ? [...el.querySelectorAll('.sw__i')] : [];
  const text = el.textContent;
  el.setAttribute('aria-label', text.trim());
  el.dataset.split = '1';
  el.textContent = '';
  const out = [];
  const tokens = [];
  // Tokenise: CJK chars are individual tokens, latin words stay whole, spaces kept.
  let buf = '';
  for (const ch of text) {
    if (ch === ' ' || ch === '\n') {
      if (buf) tokens.push(buf), (buf = '');
      tokens.push(' ');
    } else if (CJK.test(ch)) {
      if (buf) tokens.push(buf), (buf = '');
      tokens.push(ch);
    } else buf += ch;
  }
  if (buf) tokens.push(buf);

  for (const tok of tokens) {
    if (tok === ' ') {
      el.append(' ');
      continue;
    }
    const w = document.createElement('span');
    w.className = 'sw';
    w.setAttribute('aria-hidden', 'true');
    if (chars && !CJK.test(tok)) {
      for (const c of tok) {
        const i = document.createElement('span');
        i.className = 'sw__i';
        i.textContent = c;
        w.append(i);
        out.push(i);
      }
    } else {
      const i = document.createElement('span');
      i.className = 'sw__i';
      i.textContent = tok;
      w.append(i);
      out.push(i);
    }
    el.append(w);
  }
  return out;
}
