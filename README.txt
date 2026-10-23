LETTERS MENU - FOUR TABS
  Letter               the sales & incentive letter (saved letters, shared online).
  Appointment letter   Book Fair appointment for the Principal, with a 12-month x 5-week
                       table (pick which month it starts with; April to March by default).
  Proposal             the "UNIQUE Book Fair" proposal with the 12 benefit boxes, on a
                       light gradient background (or plain white). Pages break by themselves.
  Book catalogue       see below.
  Appointment letter and Proposal wording is editable and remembered on the laptop you edit it
  on; use "Reset wording" to go back to the original. Print / PDF gives A4.
  Direct links: .../#appointment  .../#proposal  .../#catalogue  open that tab after sign-in.
  proposal/ folder holds the 12 benefit-box pictures - keep it with index.html.

BOOK CATALOGUE (Letters > Book catalogue)
  Inside the Letters menu there are two tabs: Letter and Book catalogue.
  Add book-cover images, type the price under each cover, then Print / Save A4 PDF.

  With the shared database turned on, the catalogue is saved in the cloud database:
  every laptop sees the same catalogue, and edits appear within a second or two.

  DIRECT LINKS (shown at the top of the catalogue tab, with Copy buttons)
    Share link   https://YOUR-SITE.netlify.app/catalogue.html
                 Opens the catalogue straight away for anyone, with no sign-in.
                 View only, with a Print / Save PDF button. Send it to schools.
    Staff link   https://YOUR-SITE.netlify.app/#catalogue
                 Opens this app on the catalogue editor (staff sign in first).

  ONE-TIME DATABASE STEP FOR THE SHARE LINK (existing installs)
    Supabase > SQL Editor > New query > paste the contents of database-update.sql > Run.
    This lets visitors read ONLY the catalogue rows. Books, bills, letters and all other
    data stay private. (New installs: database-setup.sql already includes it.)
    Without this step staff still get the shared catalogue; only the public link is blocked.

  catalogue-bg.jpg is the background artwork - keep it in the folder.
  After uploading to Netlify, hard-refresh once (sw.js is now billing-v17).

SHARED DATABASE SETUP  (one link, many laptops, any wifi / mobile data)
=======================================================================
Do this once. Takes about 15 minutes. Everything below is free.

A. CREATE THE DATABASE (Supabase)
  1. Go to https://supabase.com > Sign up > New project. Name it e.g. "bookstore",
     set a database password (save it), region: Mumbai (ap-south-1) or Singapore.
  2. Left menu > SQL Editor > New query. Open the file database-setup.sql from this
     folder, copy ALL of it, paste, click Run. It must say "Success".
  3. Left menu > Authentication > Sign In / Providers (or "Settings"):
     TURN OFF "Allow new users to sign up".   <-- important, keeps strangers out
  4. Authentication > Users > Add user > Create new user. For each person enter
       email:    their user name + @uniquebooks.app     e.g.  owner@uniquebooks.app
       password: a strong password
     and tick "Auto Confirm User". Staff then sign in with just the user name
     (owner) and the password. No real email is needed and none is ever sent.
     (Typing a full email address on the sign-in screen also still works.)
  5. Project Settings > API. Copy two things:
       Project URL            (https://xxxxx.supabase.co)
       anon public key        (long text starting with eyJ...)

B. CONNECT THE APP
  6. Open config.js in this folder with Notepad. Paste the URL and key between the
     quotes. Save.

C. PUT THE APP ONLINE WITH A SHORT LINK (Netlify)
  7. Go to https://app.netlify.com/drop, sign in, drag this whole folder onto the page.
  8. Site configuration > Change site name > choose a short name, e.g. "uniquebooks".
     Your link is now  https://uniquebooks.netlify.app
     (Optional: buy a domain such as books.yourshop.in and add it under Domain management.)
  9. On every laptop, phone or tablet open that link, sign in with the user name and password from step 4.
     Chrome/Edge: click "Install app" to get a desktop icon.
  If you change any file later, drag the folder to Netlify again (Deploys tab) and
  change CACHE='billing-v15' in sw.js to the next number first.

D. MOVING YOUR EXISTING DATA
  Sign in FIRST on the laptop that holds your current books and bills. When asked
  "The shared database is empty...", click OK. Then sign in on the other laptops;
  they download everything. Do not sign in on several laptops with old data at once.

HOW IT BEHAVES
  - All laptops see the same books, bills, inward and outward, within a second or two.
  - Invoice and entry numbers come from the database, so two laptops never get the
    same number.
  - The status line in the left menu shows: Online / Saving / Offline.
  - If the internet drops, you can still look things up and edit books; changes upload
    when the connection returns. Generating a bill or saving an inward/outward entry
    needs internet (that is how numbers stay unique).
  - Staff accounts: add or remove people in Supabase > Authentication > Users.
  - Backups: keep using Inventory > Export all to Excel. In Supabase you can also open
    Table Editor > records and download as CSV.
  - Leave config.js empty to use the old one-laptop version with the PIN screen.

--------------------------------------------------------------------------------
UNIQUE PUBLISHERS AND DISTRIBUTORS - BILLING APP (installable)
================================================================

FILES (keep all together in one folder)
  index.html, manifest.webmanifest, sw.js,
  icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png

STEP 1 - PUT THE FILES ONLINE (needed once; installing requires https)
  Easiest: Netlify Drop
    1. Open https://app.netlify.com/drop and sign in (free).
    2. Unzip this file, then drag the whole folder onto the page.
    3. You get a link like https://your-name.netlify.app

  Alternative: GitHub Pages or any web hosting that serves https.
  To test on one computer without hosting: open a terminal in the folder,
  run  python3 -m http.server 8000  and open http://localhost:8000

STEP 2 - INSTALL
  Android (Chrome)   : open the link > tap "Install app" (or menu > Install app)
  iPhone (Safari)    : open the link > Share button > Add to Home Screen
  Windows / Mac      : open the link in Chrome or Edge > click "Install app" in the
                       app header, or the install icon in the address bar

LOGIN
  The app opens with a PIN screen. The PIN is 54321. Use "Lock / Logout" at the
  bottom of the left menu to lock it again. Note: this is a simple screen lock
  inside the page, not server-level security.

STEP 3 - FIRST USE
  1. Open the app > Inventory tab > Import Excel (columns: ISBN, Title, Author,
     Category, Price) or add books one by one.
  2. Billing tab: click a book to add, set discount and payment, Generate bill.
  3. In the bill window choose 80 mm or 58 mm paper and click Print receipt.
     In the printer dialog set margins to None and turn off headers/footers.

SAVING INTO A FOLDER ON THE COMPUTER (Chrome or Edge on Windows/Mac)
  1. Click "Choose save folder" at the top and pick a folder (create one such as
     "Bills" first).
  2. Every bill you generate is then saved automatically as INV-xxxxx.txt and
     INV-xxxxx.html inside a "Bills" sub-folder.
  3. Export buttons (inventory, sales, template) save their Excel files into an
     "Exports" sub-folder of the same folder.
  4. After you reopen the app, the browser may ask once to allow access to the
     folder again. Click Allow. Without a chosen folder, files go to Downloads.
  5. Phones cannot choose a folder; files go to the Downloads folder.

INWARD AND OUTWARD PAGES (scan and entry, with prices)
  "Inward" = books received into the shop (enter the supplier name).
  "Outward" = books sent to a school (enter the school name).
  On each page: scan a book's barcode (a USB/Bluetooth scanner types the ISBN and
  presses Enter) or tap books from the master list. Price comes from the master
  list and can be edited per line; set a discount % if needed; click "Save entry".
  Each entry gets its own number (editable prefix, e.g. IN-00001 / OUT-00001).
  Excel: in "Saved entries" choose a school (or supplier) and click "Export to
  Excel". The file has the shop header, then every entry for that school with
  ISBN, Title, Author, Category, Price, Qty, Amount, and the total/net amount.
  Use it as the bill for that school. Each saved entry can also be exported alone.
  These pages are separate from the Billing and Sales tabs.
  "Scan with camera" appears in browsers that support it.

LETTERS PAGE (To Whom It May Concern - book fair sales & incentive letter)
  Menu > Letters. Fill in the school, fair date and the sales for each block (UPI and
  Card & Cash). Totals, incentive and "Amount in Words" are calculated automatically.
  Open "Edit wording, sign-off and letterhead" to change any paragraph. Use **text**
  for bold; {school}, {campus}, {date} fill in by themselves.
  Save letter = keep it in the Saved letters list (shared across laptops when the
  shared database is on). Open = edit it again. Print / PDF = A4 letter on your
  letterhead; choose "Save as PDF" in the print window and turn headers/footers off.

GOOD TO KNOW
  - Works offline after the first load. Data (books, bills) is stored in the
    browser of each device. Different devices do not sync.
  - Back up regularly: Inventory tab > Export all to Excel.
  - Clearing browser data or uninstalling removes saved bills, so export first.
  - Saving bills to Google Drive and the Drive import work only in the Claude
    chat version, not in this installed version.
  - To change the shop name, address or Maps link, edit the SHOP, ADDR and MAPS
    lines near the top of the script in index.html.
  - After you change any file, change CACHE='billing-v1' in sw.js to
    'billing-v2' so devices pick up the update.
