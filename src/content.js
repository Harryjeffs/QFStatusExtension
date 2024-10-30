// This code is rushed more as a proof of concept than a finished product.
// It is not optimized and could be improved in many ways.
// It is also not tested on all possible cases and could break in some situations.

const informationRowSelector = ".row.information-row";
const fareCellDetailsSelector = ".fare-cell-details-information";
const priceSelector = ".amount-grp.fare-value";
const statusCreditSelector =
  ".e2e-fCondition-statuscredits .e2e-statuscredits-amount";

// Check if double status credits are enabled from the popover.js
let doubleStatusEnabled = false;
chrome.storage.local.get(["doubleStatus"], (result) => {
  doubleStatusEnabled = result.doubleStatus || false;
});

// Listen for changes to the dom for when flight information is expanded showing the status credits
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (node.matches(informationRowSelector) == false) return;
      addInformationToFlight(node);
    });
  });
});

// Logic for querying the status credit, and price doms.
function addInformationToFlight(node) {
  const detailItems = node.querySelectorAll(fareCellDetailsSelector);

  // Get all prices for this row
  const container = node.closest("upsell-itinerary-avail");
  if (!container) return;

  const prices = Array.from(container.querySelectorAll(priceSelector));
  // Process each details item
  detailItems.forEach((detailItem, index) => {
    const statusElement = detailItem.querySelector(statusCreditSelector);
    if (statusElement == false && prices[index] == false) return;

    let price = getPrice(prices[index]);
    let statusCredits = parseInt(statusElement.innerText);
    // Check if statusCredits is a valid number
    if (isNaN(statusCredits)) return;

    if (doubleStatusEnabled) {
      statusCredits *= 2;
      updateDoubleStatusHTML(statusCredits, statusElement);
    }

    if (!isNaN(price) && statusCredits) {
      setConversionHTML(statusElement, price, statusCredits);
    }
  });
}

// Show the final calculation as a new div under the original status credits centre aligned.
function setConversionHTML(statusElement, price, statusCredits) {
  const dollarPerCredit = (price / statusCredits).toFixed(2);

  let calculationDiv = document.createElement("div");
  calculationDiv.style.fontSize = "14px";
  calculationDiv.style.fontWeight = "bold";
  calculationDiv.style.color = "#666";
  calculationDiv.textContent = `$${dollarPerCredit}/SC`;

  statusElement.parentNode.insertBefore(
    calculationDiv,
    statusElement.nextSibling
  );
}

// If double status credits are enabled then show some UI changes
function updateDoubleStatusHTML(statusCredits, statusElement) {
  // Create a span for the old value with strikethrough
  const oldSpan = document.createElement("span");
  oldSpan.style.textDecoration = "line-through";
  oldSpan.textContent = statusElement.innerText;

  // Create a new span for the doubled value
  const doubledSpan = document.createElement("span");
  doubledSpan.style.color = "red";
  doubledSpan.textContent = ` ${statusCredits}`;

  // Clear the current content of statusElement
  statusElement.innerHTML = "";

  // Append the old and new spans to the statusElement
  statusElement.appendChild(oldSpan);
  statusElement.appendChild(doubledSpan);
}

// Get the price of a flight from the element, factoring in for flights that have no pricing.
function getPrice(node) {
  // Check if no seats are available
  if (node.querySelector(".no-seat")) {
    return NaN;
  }
  // Get the price of the flight
  const price = node.querySelector(".amount.cash").innerText;
  return parseFloat(price.replace(/[^0-9.]/g, ""));
}

// Observe the document for changes
observer.observe(document, { childList: true, subtree: true });
