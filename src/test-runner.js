const results = [];
let currentSuite = 'default';

export function describe(name, fn) {
  const prev = currentSuite;
  currentSuite = name;
  try { fn(); } finally { currentSuite = prev; }
}

export function it(name, fn) {
  const suite = currentSuite;
  try {
    fn();
    results.push({ suite, name, ok: true });
  } catch (err) {
    results.push({ suite, name, ok: false, err });
    console.error(`FAIL: ${suite} > ${name}`, err);
  }
}

export function assertEqual(actual, expected, msg = '') {
  if (actual !== expected) {
    throw new Error(`${msg} expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

export function assertApprox(actual, expected, eps = 1e-6, msg = '') {
  if (Math.abs(actual - expected) > eps) {
    throw new Error(`${msg} expected ≈${expected}, got ${actual}`);
  }
}

export function assertTrue(cond, msg = '') {
  if (!cond) throw new Error(msg || 'expected truthy');
}

export function report() {
  const el = document.getElementById('results');
  const pass = results.filter(r => r.ok).length;
  const fail = results.length - pass;
  el.innerHTML = `<h1>${pass} passed, ${fail} failed</h1>` +
    results.map(r =>
      `<div class="${r.ok ? 'pass' : 'fail'}">${r.ok ? 'PASS' : 'FAIL'} — ${r.suite} &gt; ${r.name}${
        r.err ? `<pre>${r.err.stack || r.err.message}</pre>` : ''
      }</div>`
    ).join('');
  return { pass, fail };
}
