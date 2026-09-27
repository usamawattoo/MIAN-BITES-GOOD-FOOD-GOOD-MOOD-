/* =========================================================
   MIAN BITES — script.js
   Shared logic for every page: cart, WhatsApp ordering,
   navigation, search and the order form.

   EDIT HERE:
   - WhatsApp number:        CONFIG.WHATSAPP_NUMBER
   - Free delivery minimum:  CONFIG.FREE_DELIVERY_THRESHOLD
   - Delivery fee below min: CONFIG.DELIVERY_FEE
   ========================================================= */

const CONFIG = {
  WHATSAPP_NUMBER: "923008118120", // country code 92 + number without leading 0
  FREE_DELIVERY_THRESHOLD: 1000,
  // Orders below the free-delivery minimum: no fixed fee was provided by the
  // restaurant, so this stays 0 and the customer is told the charge (if any)
  // will be confirmed on call/WhatsApp. Set a number here if you want an
  // automatic fee instead, e.g. DELIVERY_FEE: 99
  DELIVERY_FEE: 0,
  CART_KEY: "mianbites_cart_v1"
};

/* ---------------------------------------------------------
   Helpers
   --------------------------------------------------------- */
function formatPKR(n){
  return "Rs. " + Math.round(n).toLocaleString("en-PK");
}

function slugify(str){
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/* ---------------------------------------------------------
   Cart storage
   --------------------------------------------------------- */
function getCart(){
  try{
    const raw = localStorage.getItem(CONFIG.CART_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    return [];
  }
}

function saveCart(cart){
  try{
    localStorage.setItem(CONFIG.CART_KEY, JSON.stringify(cart));
  }catch(e){ /* storage unavailable — cart just won't persist */ }
  updateCartBadges();
}

function addItemToCart(entry){
  // entry: { name, variant, price, key }
  const cart = getCart();
  const existing = cart.find(function(i){ return i.key === entry.key; });
  if(existing){
    existing.qty += 1;
  }else{
    cart.push({
      key: entry.key,
      name: entry.name,
      variant: entry.variant || "",
      price: entry.price,
      qty: 1
    });
  }
  saveCart(cart);
  return cart;
}

function removeItemFromCart(key){
  let cart = getCart();
  cart = cart.filter(function(i){ return i.key !== key; });
  saveCart(cart);
  return cart;
}

function changeItemQty(key, delta){
  const cart = getCart();
  const item = cart.find(function(i){ return i.key === key; });
  if(!item) return cart;
  item.qty += delta;
  if(item.qty <= 0){
    return removeItemFromCart(key);
  }
  saveCart(cart);
  return cart;
}

function cartTotals(cart){
  cart = cart || getCart();
  const subtotal = cart.reduce(function(sum, i){ return sum + i.price * i.qty; }, 0);
  const count = cart.reduce(function(sum, i){ return sum + i.qty; }, 0);
  const deliveryFee = (subtotal > 0 && subtotal < CONFIG.FREE_DELIVERY_THRESHOLD) ? CONFIG.DELIVERY_FEE : 0;
  return { subtotal: subtotal, count: count, deliveryFee: deliveryFee, grandTotal: subtotal + deliveryFee };
}

function updateCartBadges(){
  const totals = cartTotals();
  document.querySelectorAll(".cart-count").forEach(function(el){
    el.textContent = totals.count;
    el.style.display = totals.count > 0 ? "flex" : "none";
  });
  const barTotal = document.getElementById("mobileBarTotal");
  if(barTotal) barTotal.textContent = formatPKR(totals.subtotal);
  if(document.getElementById("orderPageRoot")){
    renderOrderPage();
  }
  renderDrawer();
}

/* ---------------------------------------------------------
   Navigation (mobile menu)
   --------------------------------------------------------- */
function setupNavToggle(){
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("mainNav");
  if(!toggle || !nav) return;
  toggle.addEventListener("click", function(){
    nav.classList.toggle("open");
    const expanded = nav.classList.contains("open");
    toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
  });
  nav.querySelectorAll("a").forEach(function(a){
    a.addEventListener("click", function(){ nav.classList.remove("open"); });
  });
}

/* ---------------------------------------------------------
   Cart drawer (mini cart, available on every page)
   --------------------------------------------------------- */
function renderDrawer(){
  const body = document.getElementById("drawerBody");
  const foot = document.getElementById("drawerFoot");
  if(!body || !foot) return;

  const cart = getCart();
  const totals = cartTotals(cart);

  if(cart.length === 0){
    body.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem; padding:30px 0; text-align:center;">Your cart is empty.</p>';
    foot.innerHTML = '<a href="menu.html" class="btn btn-outline btn-block">Browse Menu</a>';
    return;
  }

  body.innerHTML = cart.map(function(item){
    return (
      '<div class="cart-row" data-key="' + item.key + '">' +
        '<div class="cart-row-info">' +
          '<h4>' + item.name + '</h4>' +
          (item.variant ? '<span>' + item.variant + '</span>' : "") +
        '</div>' +
        '<div class="qty-stepper">' +
          '<button type="button" class="qty-dec" aria-label="Decrease quantity">-</button>' +
          '<span>' + item.qty + '</span>' +
          '<button type="button" class="qty-inc" aria-label="Increase quantity">+</button>' +
        '</div>' +
        '<div class="cart-row-price">' + formatPKR(item.price * item.qty) + '</div>' +
        '<button type="button" class="remove-btn" aria-label="Remove item">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6"/></svg>' +
        '</button>' +
      '</div>'
    );
  }).join("");

  foot.innerHTML =
    '<div class="summary-row"><span>Subtotal</span><span>' + formatPKR(totals.subtotal) + '</span></div>' +
    (totals.subtotal > 0 && totals.subtotal < CONFIG.FREE_DELIVERY_THRESHOLD
      ? '<div class="summary-note">Add ' + formatPKR(CONFIG.FREE_DELIVERY_THRESHOLD - totals.subtotal) + ' more for free delivery.</div>'
      : '<div class="summary-note">Free delivery unlocked.</div>') +
    '<a href="order.html" class="btn btn-primary btn-block" style="margin-top:12px;">Go to Checkout</a>';

  body.querySelectorAll(".qty-inc").forEach(function(btn){
    btn.addEventListener("click", function(){
      changeItemQty(btn.closest(".cart-row").dataset.key, 1);
    });
  });
  body.querySelectorAll(".qty-dec").forEach(function(btn){
    btn.addEventListener("click", function(){
      changeItemQty(btn.closest(".cart-row").dataset.key, -1);
    });
  });
  body.querySelectorAll(".remove-btn").forEach(function(btn){
    btn.addEventListener("click", function(){
      removeItemFromCart(btn.closest(".cart-row").dataset.key);
    });
  });
}

function setupCartDrawer(){
  const overlay = document.getElementById("drawerOverlay");
  const drawer = document.getElementById("cartDrawer");
  const openBtns = document.querySelectorAll(".js-open-cart");
  const closeBtn = document.getElementById("drawerClose");
  if(!drawer || !overlay) return;

  function open(){
    drawer.classList.add("open");
    overlay.classList.add("open");
    renderDrawer();
  }
  function close(){
    drawer.classList.remove("open");
    overlay.classList.remove("open");
  }
  openBtns.forEach(function(btn){ btn.addEventListener("click", open); });
  if(closeBtn) closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", close);
}

/* ---------------------------------------------------------
   Add-to-cart buttons on menu.html / deals.html
   --------------------------------------------------------- */
function setupAddToCartButtons(){
  document.querySelectorAll(".item-card").forEach(function(card){
    const addBtn = card.querySelector(".add-btn");
    if(!addBtn) return;

    addBtn.addEventListener("click", function(){
      const baseName = card.dataset.name || card.querySelector("h3").textContent.trim();
      const flavorSelect = card.querySelector(".flavor-select");
      const sizeSelect = card.querySelector(".size-select");
      const plainVariantSelect = card.querySelector(".select-variant:not(.flavor-select):not(.size-select)");

      let price, variantLabel = "", flavorLabel = "";

      if(sizeSelect){
        price = Number(sizeSelect.value);
        variantLabel = sizeSelect.options[sizeSelect.selectedIndex].dataset.label || sizeSelect.options[sizeSelect.selectedIndex].textContent;
        if(flavorSelect){
          flavorLabel = flavorSelect.value;
          variantLabel = flavorLabel + " · " + variantLabel;
        }
      }else if(plainVariantSelect){
        price = Number(plainVariantSelect.value);
        variantLabel = plainVariantSelect.options[plainVariantSelect.selectedIndex].dataset.label || plainVariantSelect.options[plainVariantSelect.selectedIndex].textContent;
      }else{
        const priceEl = card.querySelector(".item-price");
        price = Number(priceEl.dataset.price);
      }

      const key = slugify(baseName + "-" + variantLabel);
      addItemToCart({ name: baseName, variant: variantLabel, price: price, key: key });

      addBtn.classList.add("added");
      const original = addBtn.textContent;
      addBtn.textContent = "Added";
      setTimeout(function(){
        addBtn.classList.remove("added");
        addBtn.textContent = original;
      }, 1100);
    });
  });
}

/* ---------------------------------------------------------
   Menu search (menu.html)
   --------------------------------------------------------- */
function setupMenuSearch(){
  const input = document.getElementById("menuSearchInput");
  if(!input) return;
  const cards = Array.from(document.querySelectorAll(".item-card"));
  const categories = Array.from(document.querySelectorAll(".menu-category"));
  const noResults = document.getElementById("noResults");

  input.addEventListener("input", function(){
    const term = input.value.trim().toLowerCase();
    let anyVisible = false;

    categories.forEach(function(cat){
      let catHasVisible = false;
      cat.querySelectorAll(".item-card").forEach(function(card){
        const name = (card.dataset.name || "").toLowerCase();
        const match = term === "" || name.indexOf(term) !== -1;
        card.style.display = match ? "" : "none";
        if(match) catHasVisible = true;
      });
      cat.style.display = catHasVisible ? "" : "none";
      if(catHasVisible) anyVisible = true;
    });

    if(noResults) noResults.classList.toggle("show", !anyVisible);
  });
}

/* ---------------------------------------------------------
   Order page (order.html) — full cart + checkout form
   --------------------------------------------------------- */
function renderOrderPage(){
  const listEl = document.getElementById("orderCartList");
  const summaryEl = document.getElementById("orderSummary");
  const emptyEl = document.getElementById("orderEmpty");
  if(!listEl || !summaryEl) return;

  const cart = getCart();
  const totals = cartTotals(cart);

  if(cart.length === 0){
    listEl.innerHTML = "";
    if(emptyEl) emptyEl.style.display = "block";
    summaryEl.innerHTML =
      '<h2>Order Summary</h2>' +
      '<p style="color:var(--text-muted); font-size:0.9rem;">Add items from the menu to see your total here.</p>' +
      '<a href="menu.html" class="btn btn-outline btn-block" style="margin-top:14px;">Browse Menu</a>';
    const waBtn = document.getElementById("whatsappOrderBtn");
    if(waBtn) waBtn.setAttribute("disabled", "true");
    return;
  }

  if(emptyEl) emptyEl.style.display = "none";
  const waBtn = document.getElementById("whatsappOrderBtn");
  if(waBtn) waBtn.removeAttribute("disabled");

  listEl.innerHTML = cart.map(function(item){
    return (
      '<div class="cart-row" data-key="' + item.key + '">' +
        '<div class="cart-row-info">' +
          '<h4>' + item.name + '</h4>' +
          (item.variant ? '<span>' + item.variant + '</span>' : "") +
        '</div>' +
        '<div class="qty-stepper">' +
          '<button type="button" class="qty-dec" aria-label="Decrease quantity">-</button>' +
          '<span>' + item.qty + '</span>' +
          '<button type="button" class="qty-inc" aria-label="Increase quantity">+</button>' +
        '</div>' +
        '<div class="cart-row-price">' + formatPKR(item.price * item.qty) + '</div>' +
        '<button type="button" class="remove-btn" aria-label="Remove item">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6"/></svg>' +
        '</button>' +
      '</div>'
    );
  }).join("");

  listEl.querySelectorAll(".qty-inc").forEach(function(btn){
    btn.addEventListener("click", function(){ changeItemQty(btn.closest(".cart-row").dataset.key, 1); });
  });
  listEl.querySelectorAll(".qty-dec").forEach(function(btn){
    btn.addEventListener("click", function(){ changeItemQty(btn.closest(".cart-row").dataset.key, -1); });
  });
  listEl.querySelectorAll(".remove-btn").forEach(function(btn){
    btn.addEventListener("click", function(){ removeItemFromCart(btn.closest(".cart-row").dataset.key); });
  });

  const orderType = document.querySelector('input[name="orderType"]:checked');
  const isDelivery = !orderType || orderType.value === "Delivery";

  summaryEl.innerHTML =
    '<h2>Order Summary</h2>' +
    '<div class="summary-row"><span>Items (' + totals.count + ')</span><span>' + formatPKR(totals.subtotal) + '</span></div>' +
    (isDelivery
      ? (totals.subtotal >= CONFIG.FREE_DELIVERY_THRESHOLD
          ? '<div class="summary-row"><span>Delivery</span><span>Free</span></div>'
          : '<div class="summary-row"><span>Delivery</span><span>' + (CONFIG.DELIVERY_FEE > 0 ? formatPKR(CONFIG.DELIVERY_FEE) : "Confirmed on call") + '</span></div>')
      : '<div class="summary-row"><span>Delivery</span><span>Not applicable</span></div>') +
    '<div class="summary-row total"><span>Grand Total</span><span>' + formatPKR(isDelivery ? totals.grandTotal : totals.subtotal) + '</span></div>' +
    (isDelivery && totals.subtotal > 0 && totals.subtotal < CONFIG.FREE_DELIVERY_THRESHOLD
      ? '<p class="summary-note">Add ' + formatPKR(CONFIG.FREE_DELIVERY_THRESHOLD - totals.subtotal) + ' more for free delivery.</p>'
      : "");
}

function setupOrderTypeToggle(){
  const pills = document.querySelectorAll(".radio-pill");
  const addressField = document.getElementById("addressField");
  if(pills.length === 0) return;

  function refresh(){
    pills.forEach(function(p){
      p.classList.toggle("checked", p.querySelector("input").checked);
    });
    const checked = document.querySelector('input[name="orderType"]:checked');
    if(addressField){
      addressField.style.display = (checked && checked.value === "Delivery") ? "" : "none";
    }
    renderOrderPage();
  }

  pills.forEach(function(p){
    p.querySelector("input").addEventListener("change", refresh);
  });
  refresh();
}

function validateOrderForm(){
  let valid = true;
  const name = document.getElementById("custName");
  const phone = document.getElementById("custPhone");
  const orderType = document.querySelector('input[name="orderType"]:checked');
  const address = document.getElementById("custAddress");

  function markInvalid(input, isInvalid){
    const field = input.closest(".field");
    if(!field) return;
    field.classList.toggle("invalid", isInvalid);
  }

  if(!name || name.value.trim().length < 2){
    markInvalid(name, true); valid = false;
  }else{ markInvalid(name, false); }

  const phoneDigits = phone ? phone.value.replace(/\D/g, "") : "";
  if(!phone || phoneDigits.length < 10){
    markInvalid(phone, true); valid = false;
  }else{ markInvalid(phone, false); }

  if(orderType && orderType.value === "Delivery"){
    if(!address || address.value.trim().length < 5){
      markInvalid(address, true); valid = false;
    }else{ markInvalid(address, false); }
  }

  return valid;
}

function buildWhatsAppMessage(){
  const cart = getCart();
  const totals = cartTotals(cart);
  const name = document.getElementById("custName").value.trim();
  const phone = document.getElementById("custPhone").value.trim();
  const orderType = document.querySelector('input[name="orderType"]:checked').value;
  const address = document.getElementById("custAddress") ? document.getElementById("custAddress").value.trim() : "";
  const notes = document.getElementById("custNotes") ? document.getElementById("custNotes").value.trim() : "";
  const isDelivery = orderType === "Delivery";

  let lines = [];
  lines.push("MIAN BITES — New Order");
  lines.push("------------------------------");
  lines.push("Customer Name: " + name);
  lines.push("Phone Number: " + phone);
  lines.push("Order Type: " + orderType);
  if(isDelivery) lines.push("Delivery Address: " + address);
  lines.push("");
  lines.push("Order Items:");
  cart.forEach(function(item){
    const variantText = item.variant ? " (" + item.variant + ")" : "";
    lines.push("- " + item.name + variantText + " x" + item.qty + " — " + formatPKR(item.price * item.qty));
  });
  lines.push("");
  lines.push("Subtotal: " + formatPKR(totals.subtotal));
  if(isDelivery){
    if(totals.subtotal >= CONFIG.FREE_DELIVERY_THRESHOLD){
      lines.push("Delivery Charge: Free");
    }else{
      lines.push("Delivery Charge: " + (CONFIG.DELIVERY_FEE > 0 ? formatPKR(CONFIG.DELIVERY_FEE) : "To be confirmed"));
    }
    lines.push("Grand Total: " + formatPKR(totals.grandTotal));
  }else{
    lines.push("Grand Total: " + formatPKR(totals.subtotal));
  }
  if(notes) { lines.push(""); lines.push("Notes: " + notes); }
  lines.push("");
  lines.push("Sent from mianbites website");

  return lines.join("\n");
}

function setupOrderForm(){
  const form = document.getElementById("orderForm");
  if(!form) return;

  form.addEventListener("submit", function(e){
    e.preventDefault();
    if(getCart().length === 0) return;
    if(!validateOrderForm()) return;

    const message = buildWhatsAppMessage();
    const url = "https://wa.me/" + CONFIG.WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
    window.open(url, "_blank");
  });
}

/* ---------------------------------------------------------
   Init
   --------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function(){
  setupNavToggle();
  setupCartDrawer();
  setupAddToCartButtons();
  setupMenuSearch();
  setupOrderTypeToggle();
  setupOrderForm();
  updateCartBadges();
  renderOrderPage();

  // Footer year
  const yearEl = document.getElementById("year");
  if(yearEl) yearEl.textContent = new Date().getFullYear();
});
