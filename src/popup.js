// popup.js
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("doubleStatus");

  // Load saved state
  chrome.storage.local.get(["doubleStatus"], (result) => {
    toggle.checked = result.doubleStatus || false;
  });

  // Save state when changed
  toggle.addEventListener("change", (e) => {
    chrome.storage.local.set({ doubleStatus: e.target.checked });

    // Notify content script of change
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "updateDoubleStatus",
        doubleStatus: e.target.checked,
      });
    });
  });
});
