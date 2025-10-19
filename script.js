document.addEventListener('DOMContentLoaded', () => {
  const TAX_RATE = 0; 
  const dateEl = document.getElementById('date');
  const addForm = document.getElementById('addForm');
  const itemName = document.getElementById('itemName');
  const itemQty = document.getElementById('itemQty');
  const itemPrice = document.getElementById('itemPrice');
  const billBody = document.getElementById('billBody');
  const totalAmount = document.getElementById('totalAmount');
  const clearBtn = document.getElementById('clearBtn');
  const printBtn = document.getElementById('printBtn');
  const tfoot = document.querySelector('.bill-table-footer-static tfoot'); 
  
  // UI Elements
  const quickAddMenu = document.getElementById('quickAddMenu'); 
  const historyContainer = document.getElementById('billingHistory');
  const historyList = document.getElementById('historyList');
  const tabCurrent = document.getElementById('tabCurrent');
  const tabHistory = document.getElementById('tabHistory');

  const paymentSelect = document.getElementById('paymentSelect');
  const printPayment = document.getElementById('printPayment');
  const printContainer = document.getElementById('printContainer'); 
  const darkModeToggle = document.getElementById('darkModeToggle');
  const body = document.body;
  
  const quickAddButtons = new Map(); 

  // --- CONSTANTS ---
  const STORAGE_KEY_CURRENT_BILL = 'currentBillState';
  const STORAGE_KEY_HISTORY = 'billingHistory';
  
  dateEl.textContent = new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

  // -----------------------------------------------------------------
  // Dark Mode Functions
  // -----------------------------------------------------------------

  function toggleDarkMode() {
      const isDarkMode = body.classList.toggle('dark-mode');
      localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
      updateDarkModeButton(isDarkMode);
  }

  function updateDarkModeButton(isDarkMode) {
      if (isDarkMode) {
          darkModeToggle.textContent = '☀️ Light Mode';
      } else {
          darkModeToggle.textContent = '🌙 Dark Mode';
      }
  }

  const darkModeState = localStorage.getItem('darkMode');
  const initialDarkMode = darkModeState === 'enabled';
  if (initialDarkMode) {
      body.classList.add('dark-mode');
  }
  updateDarkModeButton(initialDarkMode);

  if (darkModeToggle) {
      darkModeToggle.addEventListener('click', toggleDarkMode);
  }

  // -----------------------------------------------------------------
  // TAB SWITCHING LOGIC
  // -----------------------------------------------------------------

  function showTab(tabName) {
      tabCurrent.classList.remove('active');
      tabHistory.classList.remove('active');
      quickAddMenu.classList.add('hidden-area');
      historyContainer.classList.add('hidden-area');

      if (tabName === 'current') {
          tabCurrent.classList.add('active');
          quickAddMenu.classList.remove('hidden-area');
      } else if (tabName === 'history') {
          tabHistory.classList.add('active');
          historyContainer.classList.remove('hidden-area');
          renderHistoryList();
      }
  }

  tabCurrent.addEventListener('click', () => showTab('current'));
  tabHistory.addEventListener('click', () => showTab('history'));
  
  // Menu Definitions (unchanged)
  const categorizedSuggestions = {
      'Biryani': [
          { name: 'Chicken Biryani', price: 110 },
          { name: 'Chicken Biryani Half', price: 80 },
          { name: 'Paneer Biryani Full', price: 110 },
          { name: 'Paneer Biryani Half', price: 80 },
          { name: 'Aloo Biryani Full', price: 70 },
          { name: 'Aloo Biryani Half', price: 50 },
          { name: 'Veg Biryani Full', price: 90 },
          { name: 'Veg Biryani Half', price: 70 },
      ],
      'Chowmein': [
          { name: 'Chicken Chowmein Full', price: 70 },
          { name: 'Chicken Chowmein Half', price: 50 },
          { name: 'Egg Chowmein Full', price: 50 },
          { name: 'Egg Chowmein Half', price: 30 },
          { name: 'Veg Chowmein Full', price: 50 },
          { name: 'Veg Chowmein Half', price: 30 },
      ],
      'Rolls & Momo': [
          { name: 'Chicken Roll', price: 60 },
          { name: 'Egg Roll', price: 30 },
          { name: 'Veg Roll', price: 30 },
          { name: 'Chicken Momo', price: 50 },
          { name: 'Chicken Momo Half', price: 30 },
      ],
      'Other Items': [
          { name: 'Chicken Pakora', price: 15 },
          { name: 'Veg Pakora', price: 10 },
          { name: 'Chicken Kasha Full Plate', price: 40 },
          { name: 'Chicken Kasha Half Plate', price: 25 },
          { name: 'Boiled Egg', price: 10 },
          { name: 'Omelette', price: 15 },
          { name: 'Egg Toast', price: 30 },
          { name: 'Egg Poach', price: 15 },
          { name: 'Cold Drink', price: 40 }
      ]
  };

  const allSuggestions = Object.values(categorizedSuggestions).flat();
  
  // Datalist setup
  const dataListId = 'items-list';
  const dl = document.createElement('datalist');
  dl.id = dataListId;
  allSuggestions.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.name;
      opt.dataset.price = s.price;
      dl.appendChild(opt);
  });
  document.body.appendChild(dl);
  itemName.setAttribute('list', dataListId);

  // quick-add buttons: GENERATING CATEGORIZED BUTTONS
  if (quickAddMenu) { 
      quickAddMenu.innerHTML = ''; 
      
      for (const category in categorizedSuggestions) {
          const header = document.createElement('h3');
          header.textContent = category;
          quickAddMenu.appendChild(header);

          const buttonWrapper = document.createElement('div');
          buttonWrapper.className = 'menu-category-buttons';
          quickAddMenu.appendChild(buttonWrapper);

          categorizedSuggestions[category].forEach(s => {
              const btn = document.createElement('button');
              btn.type = 'button';
              btn.className = 'btn secondary quick-add-btn';
              btn.textContent = `${s.name} — Rs. ${s.price}`;
              
              quickAddButtons.set(s.name, btn); 
              
              btn.addEventListener('click', () => {
                  const row = createRow(s.name, 1, s.price);
                  billBody.appendChild(row);
                  updateTotal();
                  row.style.transition = 'background-color 0.25s';
                  row.style.backgroundColor = body.classList.contains('dark-mode') ? '#305c48' : '#d1e7dd'; 
                  setTimeout(() => { row.style.backgroundColor = ''; }, 350);
              });
              buttonWrapper.appendChild(btn); 
          });
      }
  }

  // Function to apply or remove the glow class
  function updateMenuHighlights() {
      const itemsInBill = new Set();
      billBody.querySelectorAll('tr').forEach(row => {
          const name = row.querySelector('.item-name').textContent;
          itemsInBill.add(name);
      });

      quickAddButtons.forEach((btn, name) => {
          if (itemsInBill.has(name)) {
              btn.classList.add('item-added');
          } else {
              btn.classList.remove('item-added');
          }
      });
  }
  
  // -----------------------------------------------------------------
  // BILLING HISTORY FUNCTIONS
  // -----------------------------------------------------------------

  function getHistory() {
      const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
      return raw ? JSON.parse(raw) : [];
  }

  function saveHistory(newBill) {
      const history = getHistory();
      history.unshift(newBill);
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
      renderHistoryList(); 
  }

  function renderHistoryList() {
      historyList.innerHTML = '';
      const history = getHistory();

      if (history.length === 0) {
          historyList.innerHTML = '<li style="justify-content:center; color: var(--secondary-color);">No billing history saved yet.</li>';
          return;
      }

      history.forEach((bill) => {
          const li = document.createElement('li');
          
          const date = new Date(bill.timestamp);
          const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
          const dateStr = date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
          
          li.innerHTML = `
              <div class="history-info">
                  <strong>Bill #${bill.billId}</strong>
                  <div class="history-time">${dateStr} at ${timeStr}</div>
              </div>
              <span class="history-total">${formatCurrency(bill.grandTotal)}</span>
              <button class="btn secondary small-btn load-bill">Load</button>
          `;
          
          li.querySelector('.load-bill').addEventListener('click', (e) => {
              e.stopPropagation(); 
              loadHistoricalBill(bill);
          });

          historyList.appendChild(li);
      });
  }
  
  function loadHistoricalBill(bill) {
      if (!confirm('Loading a historical bill will REPLACE the current bill. Continue?')) {
          return;
      }
      
      // Clear current items and display
      billBody.innerHTML = '';
      
      // Load items and payment from historical bill
      if (Array.isArray(bill.items)) {
          bill.items.forEach(it => {
              const row = createRow(it.name, it.qty, it.price, it.id);
              billBody.appendChild(row);
          });
      }
      if (bill.payment && paymentSelect) paymentSelect.value = bill.payment;
      
      // Clear the current bill storage to ensure we're starting fresh
      localStorage.removeItem(STORAGE_KEY_CURRENT_BILL); 
      
      updateTotal(true); // Recalculate and save as the new current bill
      
      showTab('current');

      alert(`Historical Bill #${bill.billId} loaded successfully. You can now modify it and print it.`);
  }

  // -----------------------------------------------------------------
  // BILL/STORAGE FUNCTIONS
  // -----------------------------------------------------------------

  function formatCurrency(num) {
      return 'Rs. ' + Number(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  
  // Helper to format date/time into a clean filename string (e.g., 2025-10-18_15-30-45)
  function formatTimestampForFilename(timestamp) {
      const date = new Date(timestamp);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const h = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      const s = String(date.getSeconds()).padStart(2, '0');
      return `${y}-${m}-${d}_${h}-${min}-${s}`;
  }

  function saveToStorage(key = STORAGE_KEY_CURRENT_BILL) {
      const items = [];
      let subtotal = 0;
      billBody.querySelectorAll('tr[data-id]').forEach(tr => {
          const name = tr.querySelector('.item-name').textContent;
          const qty = Number(tr.querySelector('.qty').value) || 1;
          const price = Number(tr.querySelector('.prc').value) || 0;
          const amount = qty * price;
          items.push({ id: tr.dataset.id, name, qty, price, amount });
          subtotal += amount;
      });

      const timestamp = Date.now();
      const state = {
          items,
          payment: paymentSelect ? paymentSelect.value : 'UPI',
          grandTotal: subtotal,
          billId: Math.floor(timestamp / 1000).toString().slice(-4),
          timestamp: timestamp
      };
      localStorage.setItem(key, JSON.stringify(state));
      return state; // Return the saved state
  }

  function loadFromStorage(key = STORAGE_KEY_CURRENT_BILL) {
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      
      billBody.innerHTML = '';
      
      try {
          const state = JSON.parse(raw);
          if (Array.isArray(state.items)) {
              state.items.forEach(it => {
                  const row = createRow(it.name, it.qty, it.price, it.id);
                  billBody.appendChild(row);
              });
          }
          if (state.payment && paymentSelect) paymentSelect.value = state.payment;
          
          updateTotal(false); 
          return true;
      } catch {
          return false;
      }
  }

  function updateTotal(shouldSave = true) {
      let subtotal = 0;
      const billItemsData = []; 
      
      billBody.querySelectorAll('tr').forEach(row => {
          const qty = Number(row.querySelector('.qty').value);
          const price = Number(row.querySelector('.prc').value);
          const amt = qty * price; 
          
          row.dataset.amount = amt.toFixed(2); 
          row.querySelector('.amt').textContent = formatCurrency(amt); 
          
          subtotal += amt;
          
          billItemsData.push({
              name: row.querySelector('.item-name').textContent,
              qty: qty,
              price: price,
              amount: amt
          });
      });

      if (subtotal === 0) {
          // No need to remove footers, just reset text
          document.getElementById('totalAmount').textContent = formatCurrency(0);
          document.getElementById('totalTextLabel').textContent = ''; 
          printContainer.textContent = generateEmptyReceipt(); 
          if (shouldSave) localStorage.removeItem(STORAGE_KEY_CURRENT_BILL);
          updateMenuHighlights(); 
          return;
      }

      ensureFooterRows();
      const grand = subtotal; 

      document.getElementById('totalAmount').textContent = formatCurrency(subtotal);
      document.getElementById('totalTextLabel').textContent = 'Total'; // Simple label for website
      
      // --- ONLY generate the verbose receipt for the hidden print container ---
      const paymentMethod = paymentSelect.value || 'UPI';
      const date = dateEl.textContent;
      const currentBillState = saveToStorage(STORAGE_KEY_CURRENT_BILL); // Save first to get the latest state/ID/Timestamp
      
      printContainer.textContent = generateTextReceipt(
          billItemsData, 
          subtotal, 
          grand, 
          paymentMethod, 
          date, 
          currentBillState.billId
      );

      // if (shouldSave) saveToStorage(STORAGE_KEY_CURRENT_BILL); // Already saved above
      updateMenuHighlights(); 
  }

  // --- Utility Functions ---

  function ensureFooterRows() {
      if (!document.getElementById('grandTotal')) {
          // Note: The HTML structure provided only has one row in tfoot by default.
          // We'll rely on the existing HTML structure for simplicity.
      }
      // Ensure Total/Grand Total label is set if the row exists (using totalTextLabel for the site display)
      const totalTextLabel = document.getElementById('totalTextLabel');
      if (totalTextLabel) {
          totalTextLabel.textContent = 'Total';
      }
  }
  
  function generateEmptyReceipt() {
      const lines = [
          '  *** Petuk Biriyana and restaurant ***',
          '      Fresh • Fast • Friendly',
          '\n---------------------------------------',
          '\n           BILL IS EMPTY\n',
          '      Thank you for dining with us.'
      ];
      return lines.join('\n');
  }

  function generateTextReceipt(items, subtotal, grandTotal, paymentMethod, date, billId) {
      // --- This function is intentionally verbose for the physical receipt ---
      const SEP = '---------------------------------------';
      const lines = [];
      const currentTime = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
      
      // RESTAURANT DETAILS (VERBOSE - FOR PRINT ONLY)
      lines.push('  *** Petuk Biriyana and restaurant ***');
      lines.push('      Fresh • Fast • Friendly');
      lines.push('     petukbiriyani2024@gmail.com');
      lines.push('  9733579705 • 8617054124');
      lines.push('  Jalchak • Pingla • Paschim Medinipur');
      lines.push(SEP);
      lines.push(`Bill ID: #${billId}`);
      lines.push(`Date: ${date}`);
      lines.push(`Time: ${currentTime}`);
      lines.push(SEP);
      
      lines.push('ITEM               QTY UNIT PRICE AMOUNT');
      lines.push(SEP);

      let totalItems = 0;
      items.forEach(item => {
          const name = String(item.name).padEnd(19).slice(0, 19); 
          const qty = String(item.qty).padStart(3); 
          const unitPrice = formatCurrency(item.price).padStart(10); 
          const amount = formatCurrency(item.amount).padStart(8); 
          lines.push(`${name}${qty} ${unitPrice} ${amount}`);
          totalItems += item.qty;
      });

      lines.push(SEP);

      const subtotalText = `Subtotal (${totalItems} Items)`.padEnd(28);
      lines.push(`${subtotalText}${formatCurrency(subtotal).padStart(8)}`);
      
      lines.push('Discount (0%)'.padEnd(28) + formatCurrency(0).padStart(8));
      lines.push(`TAX (0%)`.padEnd(28) + formatCurrency(TAX_RATE > 0 ? subtotal * TAX_RATE : 0).padStart(8)); 
      
      lines.push(SEP);
      
      const grandTotalText = 'GRAND TOTAL'.padEnd(28);
      lines.push(`${grandTotalText}${formatCurrency(grandTotal).padStart(8)}`);
      
      lines.push(SEP);

      lines.push(`Payment Method: ${paymentMethod}`);
      lines.push(`Cashier: Petuk Biriyani Staff`);
      lines.push('\n      Thank you for dining with us.');

      return lines.join('\n');
  }

  function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));
  }
  
  function createRow(name, qty, price, id = null) {
      const q = Number(qty) || 1;
      const p = Number(price) || 0;
      const amount = q * p;
      const tr = document.createElement('tr');
      tr.dataset.amount = amount.toFixed(2);
      tr.dataset.id = id || Date.now().toString(); // Use Date.now().toString() instead of rowIdCounter
      
      tr.innerHTML = `
          <td class="col-item item-name">${escapeHtml(name)}</td>
          <td class="col-qty" data-qty="${q}">
              <input class="qty" type="number" min="1" value="${q}" aria-label="Quantity for ${escapeHtml(name)}" />
          </td>
          <td class="col-price" data-price-unit="${formatCurrency(p)}">
              <input class="prc" type="number" min="0" step="0.01" value="${p.toFixed(2)}" aria-label="Price for ${escapeHtml(name)}" />
          </td>
          <td class="col-amt amt">${formatCurrency(amount)}</td>
          <td><button class="btn remove danger" type="button" aria-label="Remove ${escapeHtml(name)}">Remove</button></td>
      `;

      const qtyInput = tr.querySelector('.qty');
      const prcInput = tr.querySelector('.prc');

      function recalc() {
          const qv = Math.max(0, Number(qtyInput.value) || 0);
          const pv = Math.max(0, Number(prcInput.value) || 0);

          qtyInput.value = qv;
          prcInput.value = pv.toFixed(2);
          
          tr.querySelector('.col-qty').dataset.qty = qv;
          tr.querySelector('.col-price').dataset.priceUnit = formatCurrency(pv);
          
          updateTotal(); 
      }

      qtyInput.addEventListener('input', recalc);
      prcInput.addEventListener('input', recalc);

      qtyInput.addEventListener('keydown', (ev) => {
          if (ev.key === '+' || ev.key === '=') { ev.preventDefault(); qtyInput.value = Number(qtyInput.value || 0) + 1; recalc(); }
          else if (ev.key === '-') { ev.preventDefault(); qtyInput.value = Math.max(1, Number(qtyInput.value || 1) - 1); recalc(); }
      });

      tr.querySelector('.remove').addEventListener('click', () => {
          if (confirm(`Remove "${tr.querySelector('.item-name').textContent}" from the bill?`)) {
              tr.remove();
              updateTotal();
          }
      });

      return tr;
  }

  // --- Event Listeners ---

  // Add item form submission
  addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Simple helper to Title Case
      const toTitleCase = (str) => String(str).toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      const name = toTitleCase(itemName.value.trim());
      const qty = Math.max(1, Number(itemQty.value) || 1);
      const price = Math.max(0, Number(itemPrice.value) || 0);

      if (!name) { itemName.focus(); return; }

      const row = createRow(name, qty, price);
      billBody.appendChild(row);
      updateTotal();
      
      // Scroll to the bottom of the bill
      const billWrapper = document.querySelector('.bill-table-wrapper');
      if (billWrapper) billWrapper.scrollTop = billWrapper.scrollHeight;

      itemName.value = '';
      itemQty.value = '1';
      itemPrice.value = '';
      itemName.focus();
  });

  // Clear button: Save current bill to history and clear
  clearBtn.addEventListener('click', () => {
      if (billBody.children.length === 0) {
          alert('The current bill is already empty.');
          return;
      }
      
      if (confirm('Save and Clear the current bill? This will move it to History.')) {
          const currentBillState = JSON.parse(localStorage.getItem(STORAGE_KEY_CURRENT_BILL));
          if (currentBillState && currentBillState.items && currentBillState.items.length > 0) {
              saveHistory(currentBillState); 
          }

          billBody.innerHTML = '';
          localStorage.removeItem(STORAGE_KEY_CURRENT_BILL);
          updateTotal(); 
      }
  });

  // File Download Function
  function downloadReceiptFile(receiptText, timestamp) {
      const filenameTime = formatTimestampForFilename(timestamp);
      const filename = `Petuk_Bill_${filenameTime}.txt`;
      
      const blob = new Blob([receiptText], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }
  
  // Print button: Calculates total, Downloads file, Saves to history, Clears bill
  printBtn.addEventListener('click', () => {
      if (billBody.children.length === 0) {
          alert('Cannot print an empty bill.');
          return;
      }
      
      // 1. Ensure the final bill state is saved (and calculated)
      updateTotal(); 
      const currentBillState = JSON.parse(localStorage.getItem(STORAGE_KEY_CURRENT_BILL));
      
      if (!currentBillState || currentBillState.items.length === 0) return;
      
      // 2. Download the receipt file with timestamp name
      const receiptText = printContainer.textContent;
      downloadReceiptFile(receiptText, currentBillState.timestamp);

      // 3. Save the finalized current bill to history
      // Note: The updateTotal call implicitly saved the state with the latest Bill ID/Timestamp.
      saveHistory(currentBillState); 
      
      // 4. Trigger physical print dialog
      if (paymentSelect && printPayment) printPayment.textContent = 'Payment: ' + paymentSelect.value;
      window.print();
      
      // 5. Clear the bill display and storage
      billBody.innerHTML = '';
      localStorage.removeItem(STORAGE_KEY_CURRENT_BILL);
      updateTotal(); 
  });

  // Update payment method and recalculate total (to update print container)
  if (paymentSelect && printPayment) {
      paymentSelect.addEventListener('change', () => {
          printPayment.textContent = 'Payment: ' + paymentSelect.value;
          updateTotal(); 
      });
      printPayment.textContent = 'Payment: ' + (paymentSelect.value || 'UPI');
  }

  // --- Initialization ---
  loadFromStorage(STORAGE_KEY_CURRENT_BILL);
  updateTotal();
  renderHistoryList(); 
});