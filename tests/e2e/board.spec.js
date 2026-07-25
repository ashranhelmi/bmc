import { test, expect } from "@playwright/test"
import { execSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// This app is a single-board-per-process instance (see Board::current()) —
// every test shares the one running app/Reverb server, so state has to be
// reset between tests rather than spinning up a fresh app each time.
test.beforeEach(() => {
  execSync("php artisan migrate:fresh --force", { cwd: path.resolve(__dirname, "../..") })
})

async function startSessionAndGetPin(hostPage) {
  await hostPage.goto("/")
  await hostPage.getByTestId("start-session").click()
  const pin = await hostPage.getByTestId("session-pin").innerText()
  await hostPage.getByTestId("continue-to-board").click()
  return pin
}

async function joinBoard(page, pin, name, color) {
  await page.goto("/")
  await page.getByTestId("pin-input").fill(pin)
  await page.getByTestId("pin-submit").click()
  await joinAsCurrentUser(page, name, color)
}

// For the HOST specifically, once past the Share screen — a fresh page.goto
// would force a full remount, which (correctly, by design) re-shows the
// Share screen on reload. The host is already pin-verified and on the board
// page, so this skips straight to the join form instead of navigating again.
async function joinAsCurrentUser(page, name, color) {
  await page.getByTestId("join-open").click()
  await page.getByTestId("join-name").fill(name)
  await page.getByTestId(`color-swatch-${color}`).click()
  await page.getByTestId("join-submit").click()
}

const COLORS = {
  blue: "#2a78d6",
  orange: "#eb6834",
}

test("host starts a session and a participant's new note appears for the host without reload", async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const guestCtx = await browser.newContext()
  const host = await hostCtx.newPage()
  const guest = await guestCtx.newPage()

  const pin = await startSessionAndGetPin(host)
  await joinBoard(guest, pin, "Guest One", COLORS.blue)

  await guest.getByTestId("add-note-key_partners").click()
  await guest.getByTestId("add-note-textarea").fill("A partner idea from the guest")
  await guest.getByTestId("add-note-submit").click()

  // Host never reloaded — the section's note count updating at all has to
  // come purely via the NoteCreated broadcast, not a page visit. Sections
  // start collapsed once they hold a note, same as a real viewer would see —
  // expand it to see the actual note content.
  await host.getByText("1 note").click()
  await expect(host.getByTestId("note-card").filter({ hasText: "A partner idea from the guest" })).toBeVisible()

  await hostCtx.close()
  await guestCtx.close()
})

test("both participants see each other in the header roster, and a new note pulses its section", async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const guestCtx = await browser.newContext()
  const host = await hostCtx.newPage()
  const guest = await guestCtx.newPage()

  const pin = await startSessionAndGetPin(host)
  await joinAsCurrentUser(host, "Host", COLORS.blue)
  await joinBoard(guest, pin, "Guest", COLORS.orange)

  // Each side's roster must include BOTH participants, not just themselves.
  const hostRoster = host.getByTestId("participant-roster")
  const guestRoster = guest.getByTestId("participant-roster")
  await expect(hostRoster.getByText("Host")).toBeVisible()
  await expect(hostRoster.getByText("Guest")).toBeVisible()
  await expect(guestRoster.getByText("Host")).toBeVisible()
  await expect(guestRoster.getByText("Guest")).toBeVisible()

  await guest.getByTestId("add-note-key_partners").click()
  await guest.getByTestId("add-note-textarea").fill("Watch this section pulse")
  await guest.getByTestId("add-note-submit").click()

  // The host never expanded the section — the pulse is a passive signal on
  // the still-collapsed header, not something that requires interaction.
  await expect(host.getByTestId("section-key_partners")).toHaveClass(/animate-pulse/)

  await hostCtx.close()
  await guestCtx.close()
})

test("a color already claimed by a connected participant is rejected for the next joiner", async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const guestCtx = await browser.newContext()
  const host = await hostCtx.newPage()
  const guest = await guestCtx.newPage()

  const pin = await startSessionAndGetPin(host)
  await joinAsCurrentUser(host, "Host", COLORS.blue)

  await guest.goto("/")
  await guest.getByTestId("pin-input").fill(pin)
  await guest.getByTestId("pin-submit").click()
  await guest.getByTestId("join-open").click()
  await guest.getByTestId("join-name").fill("Guest")
  // The blue swatch should already be disabled once the host holds it.
  await expect(guest.getByTestId(`color-swatch-${COLORS.blue}`)).toBeDisabled()

  await hostCtx.close()
  await guestCtx.close()
})

test("a participant's live cursor appears as a DOM node on the other participant's page", async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const guestCtx = await browser.newContext()
  const host = await hostCtx.newPage()
  const guest = await guestCtx.newPage()

  const pin = await startSessionAndGetPin(host)
  await joinAsCurrentUser(host, "Host", COLORS.blue)
  await joinBoard(guest, pin, "Guest", COLORS.orange)

  // Both sides' presence-channel WebSocket subscription needs to actually be
  // live before a whisper sent by one will be received by the other.
  await expect(host.getByTestId("board-page")).toHaveAttribute("data-presence-ready", "true")
  await expect(guest.getByTestId("board-page")).toHaveAttribute("data-presence-ready", "true")

  const guestCanvas = guest.locator(".relative.flex-1.overflow-auto")
  await guestCanvas.hover({ position: { x: 100, y: 100 } })
  await guestCanvas.hover({ position: { x: 150, y: 160 } })

  // Rendered by useCursorBroadcast on the HOST's page as a plain DOM node,
  // never through React state — see that hook's comment.
  await expect(host.getByTestId("remote-cursor")).toBeVisible()

  await hostCtx.close()
  await guestCtx.close()
})

test("locking the board hides the add-note control for participants", async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const guestCtx = await browser.newContext()
  const host = await hostCtx.newPage()
  const guest = await guestCtx.newPage()

  const pin = await startSessionAndGetPin(host)
  await joinAsCurrentUser(host, "Host", COLORS.blue)
  await joinBoard(guest, pin, "Guest", COLORS.orange)

  await expect(guest.getByTestId("add-note-key_partners")).toBeVisible()

  await host.getByTestId("lock-toggle").click()

  // Guest never reloaded — the lock broadcast alone should hide editing.
  await expect(guest.getByTestId("add-note-key_partners")).toHaveCount(0)

  await hostCtx.close()
  await guestCtx.close()
})

test("export downloads JSON including a freeform-section note", async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const host = await hostCtx.newPage()

  const pin = await startSessionAndGetPin(host)
  await joinAsCurrentUser(host, "Host", COLORS.blue)

  await host.getByTestId("add-note-freeform").click()
  await host.getByTestId("add-note-textarea").fill("A loose freeform idea")
  await host.getByTestId("add-note-submit").click()
  await expect(host.getByTestId("note-card").filter({ hasText: "A loose freeform idea" })).toBeVisible()

  const [download] = await Promise.all([
    host.waitForEvent("download"),
    host.getByTestId("export-button").click(),
  ])
  const downloadPath = await download.path()
  const contents = JSON.parse(await import("node:fs").then((fs) => fs.promises.readFile(downloadPath, "utf-8")))

  expect(contents.schema_version).toBe(1)
  expect(contents.notes.some((n) => n.section === "freeform" && n.body === "A loose freeform idea")).toBe(true)

  await hostCtx.close()
})

test("dragging a note from a section into the free-form area updates both browsers without reload", async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const guestCtx = await browser.newContext()
  const host = await hostCtx.newPage()
  const guest = await guestCtx.newPage()

  const pin = await startSessionAndGetPin(host)
  await joinAsCurrentUser(host, "Host", COLORS.blue)
  await joinBoard(guest, pin, "Guest", COLORS.orange)

  await host.getByTestId("add-note-key_partners").click()
  await host.getByTestId("add-note-textarea").fill("Move me to freeform")
  await host.getByTestId("add-note-submit").click()
  // Sections start collapsed once they hold a note — expand to make the
  // card draggable (dnd-kit's useSortable can't target a hidden element).
  await host.getByText("1 note").click()

  const noteCard = host.getByTestId("note-card").filter({ hasText: "Move me to freeform" })
  const noteBox = await noteCard.boundingBox()
  const targetBox = await host.getByTestId("section-drop-freeform").boundingBox()
  const startX = noteBox.x + noteBox.width / 2
  const startY = noteBox.y + noteBox.height / 2
  const endX = targetBox.x + targetBox.width / 2
  const endY = targetBox.y + targetBox.height / 2

  await host.mouse.move(startX, startY)
  await host.mouse.down()
  // A small nudge first to cross dnd-kit's activation-distance threshold,
  // THEN one direct jump straight to the target — deliberately NOT a
  // stepped sweep across the whole page. dnd-kit live-reflows the layout as
  // the pointer passes near OTHER sections during a drag (correct, intended
  // behavior), so a multi-step move along a long straight line ends up
  // colliding with whatever section happens to be under the path partway
  // through, not the original target's pre-drag coordinates.
  await host.mouse.move(startX + 10, startY + 10)
  await host.mouse.move(endX, endY)
  await host.mouse.move(endX, endY) // second move at the same point registers a final pointer position for the drop
  await host.mouse.up()

  // Both browsers must reflect the move — the mover's own via the local
  // optimistic state, the OTHER participant's purely via the
  // NotesReordered broadcast, without any reload.
  await expect(
    host.getByTestId("section-drop-freeform").getByTestId("note-card").filter({ hasText: "Move me to freeform" }),
  ).toBeVisible()
  await expect(
    guest.getByTestId("section-drop-freeform").getByTestId("note-card").filter({ hasText: "Move me to freeform" }),
  ).toBeVisible()

  await hostCtx.close()
  await guestCtx.close()
})

test("host importing a fixture updates a connected participant's board via broadcast", async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const guestCtx = await browser.newContext()
  const host = await hostCtx.newPage()
  const guest = await guestCtx.newPage()

  const pin = await startSessionAndGetPin(host)
  await joinAsCurrentUser(host, "Host", COLORS.blue)
  await joinBoard(guest, pin, "Guest", COLORS.orange)

  await host.getByTestId("import-open").click()
  await host
    .getByTestId("import-file-input")
    .setInputFiles(path.resolve(__dirname, "fixtures/import-sample.json"))
  await host.getByTestId("import-submit").click()

  // Guest never reloaded — the imported note and lock state must arrive via
  // the BoardImported broadcast triggering a refetch. The section starts
  // collapsed once it holds a note, same as any real viewer would see.
  await expect(guest.getByText("Locked")).toBeVisible()
  await guest.getByText("1 note").click()
  await expect(guest.getByTestId("note-card").filter({ hasText: "Imported fixture note" })).toBeVisible()

  await hostCtx.close()
  await guestCtx.close()
})
