// Browser tests: build with `npm run build`, then `npm run e2e`.
// They serve dist/ with `vite preview` and drive the system Chrome through playwright-core.
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { chromium } from "playwright-core";
import type { Browser, Page } from "playwright-core";

const PORT = 4410;
const URL = `http://localhost:${PORT}/`;
const SIX_BYTES = "MOV WORD PTR [BX+SI+0200h], 1234h\nMOV AX, [0200h]\nHLT";

let server: ChildProcess;
let browser: Browser;

before(async () => {
  server = spawn("node_modules/.bin/vite", ["preview", "--port", String(PORT), "--strictPort"], { stdio: "ignore" });
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(URL)).ok) break;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  browser = await chromium.launch({ channel: "chrome", headless: true });
});

after(async () => {
  await browser?.close();
  server?.kill();
});

async function open(width = 1440, height = 800): Promise<Page> {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  (page as Page & { errors: string[] }).errors = errors;
  await page.goto(URL);
  await page.waitForSelector(".board");
  await page.evaluate(() => document.fonts.ready);
  return page;
}
const errorsOf = (page: Page) => (page as Page & { errors: string[] }).errors;

const mode = (page: Page) => page.evaluate(() => (document.querySelector(".layout")!.classList.contains("run") ? "run" : "edit"));

async function setSource(page: Page, text: string) {
  await page.evaluate((t) => {
    const ta = document.querySelector("textarea")!;
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(ta, t);
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }, text);
}

/** Finish running CSS transitions so measurements see the settled layout. */
const settle = (page: Page) => page.evaluate(() => document.getAnimations().forEach((a) => (a as CSSTransition).transitionProperty && a.finish()));

describe("layout", () => {
  const SIZES: [number, number][] = [[1100, 660], [1280, 720], [1366, 657], [1440, 800], [1920, 1080], [2560, 1300], [900, 1000], [375, 812]];
  for (const [w, h] of SIZES) {
    test(`${w}x${h} fits without overflow or clipping`, async () => {
      const page = await open(w, h);
      await setSource(page, SIX_BYTES);
      await page.click('[aria-label="Step forward"]');
      await settle(page);
      const issues = await page.evaluate(async () => {
        const out: string[] = [];
        const r = (s: string) => document.querySelector(s)!.getBoundingClientRect();
        const desktop = innerWidth >= 1100 && innerHeight >= 640;
        const doc = document.documentElement;
        if (desktop && doc.scrollHeight > innerHeight + 1) out.push("page scrolls vertically");
        if (doc.scrollWidth > innerWidth + 1) out.push("page scrolls sideways");
        if (r(".editor").bottom > r(".editor-panel .hint").top + 1) out.push("editor overlaps its hint");
        if (r(".board-wrap").height < 50) out.push("die collapsed");
        for (const t of ["Memory", "Encoding"]) {
          ([...document.querySelectorAll(".tab")].find((x) => x.textContent === t) as HTMLElement).click();
          await new Promise((res) => setTimeout(res, 50));
          const inner = document.querySelector(".enc, .mem")!;
          if (desktop && inner.scrollHeight > inner.clientHeight + 1) out.push(`${t} overflows`);
        }
        const sel = ".gutter-line, .btn, .tab, .pill, .field-label, .hex-cell, .reg, .select, h1, h2";
        for (const e of document.querySelectorAll(sel)) if (e.scrollWidth > e.clientWidth + 1) out.push(`clipped ${e.className}: ${e.textContent}`);
        return out;
      });
      assert.deepEqual(issues, []);
      assert.deepEqual(errorsOf(page), []);
      await page.close();
    });
  }

  test("bytes column fits a 6-byte instruction in edit mode", async () => {
    for (const [w, h] of [[1100, 660], [1440, 800], [900, 1000]] as const) {
      const page = await open(w, h);
      await setSource(page, SIX_BYTES);
      const clipped = await page.evaluate(() =>
        [...document.querySelectorAll(".bytes-line")].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent),
      );
      assert.deepEqual(clipped, [], `${w}x${h}`);
      await page.close();
    }
  });

  test("stepping through every example never moves the layout", async () => {
    const page = await open();
    const ids = await page.$$eval('select[aria-label="Example program"] option', (o) => o.map((x) => (x as HTMLOptionElement).value));
    for (const id of ids) {
      await page.selectOption('select[aria-label="Example program"]', id);
      const r = await page.evaluate(async () => {
        const step = document.querySelector('[aria-label="Step forward"]') as HTMLButtonElement;
        const sizes = new Set<string>();
        let n = 0;
        while (!step.disabled && n < 400) {
          step.click();
          n++;
          await new Promise((res) => setTimeout(res, 0));
          document.getAnimations().forEach((a) => (a as CSSTransition).transitionProperty && a.finish());
          const h = (s: string) => Math.round(document.querySelector(s)!.getBoundingClientRect().height);
          sizes.add(`${h(".board-wrap")}/${h(".editor")}/${h(".phase-box")}`);
        }
        return { n, sizes: [...sizes], end: document.querySelector(".phase-box")!.textContent };
      });
      assert.ok(r.n > 3, id);
      assert.match(r.end ?? "", /Halted after/, id);
      // The first step morphs edit -> run; after that every step keeps the same sizes.
      assert.equal(r.sizes.length, 1, `${id}: ${r.sizes.join(" ")}`);
      await page.keyboard.press("e");
    }
    assert.deepEqual(errorsOf(page), []);
    await page.close();
  });
});

describe("interaction", () => {
  test("arrow keys step after using the checkbox and the example picker", async () => {
    const page = await open();
    await page.click(".toggle input");
    await page.click(".toggle input");
    await page.keyboard.press("ArrowRight");
    assert.equal(await mode(page), "run");
    await page.keyboard.press("e");
    assert.equal(await mode(page), "edit");
    await page.selectOption('select[aria-label="Example program"]', "max");
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.inputValue('select[aria-label="Example program"]'), "max");
    assert.equal(await mode(page), "run");
    await page.close();
  });

  test("nothing happens behind the Reference dialog; padding clicks keep it open", async () => {
    const page = await open();
    await page.keyboard.press("ArrowRight");
    const before = await page.textContent(".phase-text");
    await page.click("text=Reference");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("e");
    assert.equal(await page.textContent(".phase-text"), before);
    assert.equal(await mode(page), "run");
    const box = (await page.locator("dialog").boundingBox())!;
    await page.mouse.click(box.x + 6, box.y + box.height / 2);
    assert.ok(await page.evaluate(() => document.querySelector("dialog")!.open));
    await page.mouse.click(5, 5);
    assert.ok(!(await page.evaluate(() => document.querySelector("dialog")!.open)));
    await page.close();
  });

  test("read-only code ignores Tab and modifier shortcuts pass through", async () => {
    const page = await open();
    await page.keyboard.press("ArrowRight");
    const src = await page.inputValue("textarea");
    await page.focus("textarea");
    await page.keyboard.press("Tab");
    assert.equal(await page.inputValue("textarea"), src);
    assert.equal(await mode(page), "run");
    const prevented = await page.evaluate(() => {
      const ev = new KeyboardEvent("keydown", { key: "ArrowLeft", altKey: true, cancelable: true });
      window.dispatchEvent(ev);
      return ev.defaultPrevented;
    });
    assert.equal(prevented, false);
    await page.close();
  });

  test("current line stays visible after the editor shrinks into run mode", async () => {
    const page = await open(1920, 1080);
    await page.selectOption('select[aria-label="Example program"]', "max");
    for (let i = 0; i < 90; i++) await page.keyboard.press("ArrowRight");
    await page.keyboard.press("e");
    await page.waitForTimeout(700);
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(900);
    const visible = await page.evaluate(() => {
      const hl = document.querySelector(".line-highlight")!.getBoundingClientRect();
      const ta = document.querySelector("textarea")!.getBoundingClientRect();
      return hl.top >= ta.top - 1 && hl.bottom <= ta.bottom + 1;
    });
    assert.ok(visible);
    await page.close();
  });

  test("external bus is lit only in phases that use memory", async () => {
    const page = await open();
    await setSource(page, "MOV AX, [0200h]\nHLT");
    const seen: string[] = [];
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("ArrowRight");
      const [title, lit] = await page.evaluate(() => [document.querySelector(".pill.current")?.textContent ?? "", document.querySelectorAll(".ext.live").length] as const);
      seen.push(`${title}:${lit}`);
      if (["Decode", "Address", "Execute"].includes(title)) assert.equal(lit, 0, seen.join(" "));
      if (["Fetch", "Read memory"].includes(title)) assert.ok(lit > 0, seen.join(" "));
    }
    await page.close();
  });

  test("hovering a byte shows its address", async () => {
    const page = await open();
    await page.keyboard.press("ArrowRight");
    await settle(page);
    await page.click('role=tab[name="Memory"]');
    await page.hover(".hex-cell >> nth=3");
    assert.match((await page.textContent(".byte-note")) ?? "", /^DS:0203 = 2000:0203 → 20203h holds/);
    await page.close();
  });

  test("the edit/run morph runs at full frame rate", async () => {
    const page = await open();
    const t = await page.evaluate(async () => {
      const frames: number[] = [];
      let last = performance.now();
      let stop = false;
      const loop = (now: number) => {
        frames.push(now - last);
        last = now;
        if (!stop) requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
      await new Promise((r) => setTimeout(r, 200));
      frames.length = 0;
      (document.querySelector('[aria-label="Step forward"]') as HTMLButtonElement).click();
      await new Promise((r) => setTimeout(r, 700));
      stop = true;
      return frames.slice(1);
    });
    assert.ok(t.length > 30);
    assert.ok(Math.max(...t) < 34, `slowest frame ${Math.max(...t).toFixed(1)} ms`);
    await page.close();
  });
});
