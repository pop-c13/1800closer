# 1-800-CLOSER Audio Bridge — Chrome Extension

## What This Does
Captures Google Meet tab audio (both sides of the conversation) and streams it to the 1-800-CLOSER Manager Hub so managers can listen to live sales calls without joining the Google Meet.

## How It Works
1. Extension detects when a Google Meet tab is active
2. When a manager clicks "Listen In", the app signals the extension
3. Extension uses chrome.tabCapture to grab the Meet tab's audio output
4. Audio is relayed to the manager's browser via WebRTC peer connection
5. Manager hears the full conversation. Prospect has no idea.

## Installation

### For Testing (manual):
1. Open Chrome → go to chrome://extensions
2. Enable "Developer mode" (toggle, top right)
3. Click "Load unpacked"
4. Select this /chrome-extension/ folder
5. The extension installs. You'll see the icon in your toolbar.

### For Production (IT deployment to 170 reps):
Push via Chrome Enterprise policy:
- Google Admin Console → Devices → Chrome → Apps & Extensions
- Add the extension by ID
- Set to "Force Install"
- All managed Chrome browsers receive it automatically
- Reps don't need to do anything

## Privacy
- No audio is recorded or stored by this extension
- Audio is streamed peer-to-peer via WebRTC (rep browser → manager browser)
- Call recordings continue through Google Meet → Drive → Salesforce (existing pipeline)
- Prospects have already consented to recording (stated in slide 1 of the consultation script)
- Extension only activates on meet.google.com tabs when 1-800-CLOSER is also running

## Permissions
- tabCapture: Required to capture the Meet tab's audio
- activeTab: Required to identify which tab is the Meet call
- scripting: Required to inject the content script on Meet pages
