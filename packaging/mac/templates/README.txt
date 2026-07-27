BMC — Business Model Canvas workshop tool
==========================================

TO START (first time only - two extra steps):

  STEP 1 — Move this whole folder out of Downloads, Desktop, or Documents.
  macOS blocks apps like this one from reading files inside those three
  folders specifically, even after the other steps below. Drag the whole
  extracted "BMC-Mac" folder to your Home folder or your Applications
  folder first - anywhere else works fine, just not those three.

  STEP 2 — This app isn't signed by an identified Apple developer, so
  macOS will also block it the first time for that separate reason. Open
  Terminal (Spotlight -> type "Terminal"), navigate into the folder's new
  location, and run this once:

      cd path/to/BMC-Mac
      xattr -cr .

  IMPORTANT: run it on the whole folder (the "." above), not just on the
  two app files - the PHP program bundled inside also needs to be cleared,
  or Start BMC will silently fail to boot even though nothing looks wrong.

  After both steps, double-click "Start BMC.app" normally - your browser
  will open automatically after a couple of seconds. You won't need to
  repeat either step again once done.

TO LET OTHERS JOIN:
  Everyone must be on the same WiFi network as this computer.
  Click "Start Session" - a PIN and QR code will appear for others to join with.

TO STOP:
  Double-click "Stop BMC.app" when you're done.

That's it - nothing else to install or configure.
