CTRLZi PHOTOBOOTH STUDIO
========================

A browser-based photobooth layout editor built with HTML, CSS and JavaScript.

FEATURES
- Visual canvas editor and preset layouts
- 2x6, 4x6 and custom print dimensions
- Add, move and resize photo frames
- Add text and customize its color and size
- Upload a background image, logo or transparent PNG overlay
- Change background color
- Save and load templates in this browser using localStorage
- Export a print-quality PNG at 300 DPI
- Webcam preview and capture

HOW TO RUN
1. Extract the ZIP file.
2. Open the folder in Visual Studio Code.
3. Recommended: install the VS Code "Live Server" extension.
4. Right-click index.html and choose "Open with Live Server".
5. Allow camera permission when prompted.

You can also run a local server from this folder:
  py -m http.server 5500
Then open:
  http://localhost:5500

IMPORTANT NOTES
- Webcam access normally requires localhost or HTTPS.
- Saved templates are stored in this browser on this device. Clearing browser data may remove them.
- Export is a PNG at 300 pixels per inch. Confirm your printer's paper size and print settings before production.
- This is a front-end starter application. It does not yet include payment processing, customer/session records, cloud sync, DSLR tethering, or automatic printer selection.
