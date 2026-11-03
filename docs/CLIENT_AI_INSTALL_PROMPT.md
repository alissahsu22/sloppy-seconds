# Prompt for the site owner's AI browser assistant

Give this to the Sloppy Seconds site owner. They log in to Squarespace in their own browser, open an AI assistant that can control that browser (for example Claude in Chrome), and paste everything below the line. The hosting is already live and verified for release `cd5cd873eac5`.

---

I'm logged in to Squarespace for the website sloppysecondsinc.org. Please install the "Wilbur and Toodles" games on our **Our Animals** page (the public address is https://www.sloppysecondsinc.org/animals). The games are already hosted; you only need to add two pieces of code in Squarespace. Work in my already logged-in browser. Never type, change, or ask me for passwords, and never change billing or the plan.

Rules for the whole task:

- Do not delete, replace, or edit any existing content, blocks, or code. Only add what's described below.
- Paste code exactly as written. Don't reformat it, shorten it, or "fix" it.
- If anything below doesn't match what you see, or a step fails twice, stop and tell me what you see. Don't improvise.

**Step 1: Check that the plan allows custom code.**
Open the site's Settings and search for or find **Code Injection** (usually Settings → Advanced → Code Injection; in newer menus Settings → Website → Code Injection or "Custom Code"). If it isn't there, or the page says it requires an upgrade, **stop**. Tell me the plan needs Code Injection (Core, Plus or Advanced, or the older Business or Commerce plans), and do nothing else.

**Step 2: Add the script to the site-wide Footer.**
In Code Injection, find the **Footer** box. That's the site-wide footer, not a single page's header. If the Footer box already has code, leave it all in place. Click at the very end, add a new line, and paste this:

```html
<script
  src="https://sloppy-seconds.vercel.app/widget/sanctuary.js?v=cd5cd873eac5"
  defer
  crossorigin="anonymous"
  integrity="sha384-Ppv+l++sFdDRmAwxUR/NGpBYoSO3vt4Di7cENnjb3Uxhi2nel6L9/3e4/E6bEese"
  data-asset-base="https://sloppy-seconds.vercel.app"
  data-only-path="/animals"
  data-help-href="https://www.sloppysecondsinc.org/ways-to-help"
  data-animals="#team"
  data-clearance="#header, .sqs-announcement-bar, .sqs-mobile-info-bar, [data-ss-clearance]"
  data-strain-photos="#block-da733b122b1ccc336d09"
  data-strain-letters="#team h1"
></script>
```

Save. If the Footer box already contains `sloppy-seconds.vercel.app/widget/sanctuary.js`, don't add a second copy. Tell me what's there instead.

**Step 3: Add a Code block to the Our Animals page.**
Go to Pages, open **Our Animals** (`/animals`), and click Edit. Find the section with the heading "Meet the rescued animals at our sanctuary". Add a new **Code** block (the "+" or insert point, then Code) just below that introduction, above the first animal biography. Don't use a Text or Markdown block. In the Code block, choose **HTML**, turn **Display Source** off, and paste exactly:

```html
<div data-ss-mount></div>
<noscript>The animal stories need JavaScript. You can still meet the animals on this page.</noscript>
```

Leave the block's preview empty. Squarespace may show "Script disabled" or a blank box while editing, which is normal. Save the page, and publish it if Squarespace asks.

**Step 4: Check the live site as a visitor.**
Open a new **private/incognito** window, not the editor, and go to https://www.sloppysecondsinc.org. Then:

1. Use the site menu to go to **Our Animals**. Exactly **one** card should appear near the top, with a small pixel pig, arrows to switch between Wilbur and Toodles, a "Start exploring" button, and a "Field Guide" link.
2. Click "Start exploring" for Wilbur. A game window opens. Use "Skip to the ending" if offered, or press the arrow keys to play. Close the window. A pig should now walk along the bottom of the page.
3. Switch to Toodles with the arrow and do the same.
4. Open the Field Guide, then close it with the × button. The page should scroll normally.
5. Click to another page in the site menu. No pigs should be there. Go back to Our Animals: still only one card.
6. Reload Our Animals once more, then also open https://www.sloppysecondsinc.org/animals directly.

If the card doesn't appear, open the browser's developer console on the Animals page. Tell me any red error that mentions `sanctuary.js`, `integrity`, or `blocked`, and whether you see the Code block in the editor.

**When done,** tell me:

- Which steps you completed.
- What you pasted and where.
- The results of each check in step 4.
- Anything you couldn't do.

**To undo everything:** remove the script from the Footer Code Injection, delete the Code block from Our Animals, and save.
