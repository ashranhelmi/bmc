BMC — Business Model Canvas workshop tool
==========================================

TO START (first time only - one extra step):
  This app isn't signed by an identified Apple developer, so macOS will
  block it the first time. Before double-clicking anything, open Terminal
  (Spotlight -> type "Terminal"), navigate into the folder you extracted,
  and run this once:

      cd path/to/BMC-Mac
      xattr -cr .

  IMPORTANT: run it on the whole folder (the "." above), not just on the
  two app files - the PHP program bundled inside also needs to be cleared,
  or Start BMC will silently fail to boot even though nothing looks wrong.

  After that, double-click "Start BMC.app" normally - your browser will
  open automatically after a couple of seconds. You won't need to repeat
  the Terminal step again on this Mac.

TO LET OTHERS JOIN:
  Everyone must be on the same WiFi network as this computer.
  Click "Start Session" - a PIN and QR code will appear for others to join with.

TO STOP:
  Double-click "Stop BMC.app" when you're done.

That's it - nothing else to install or configure.
