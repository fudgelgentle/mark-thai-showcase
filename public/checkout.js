"use strict";

(function() {

  // *An array that stores the checkout items in the format:
  //*   [default_price, quantity, title, price]
  let shopping_cart_array = [];

  // ! (Temporary) constant values / no need to move to backend because
  // ! the actual calculation will be handled by Stripe
  const TAX_RATE = 1.10;
  const SHIPPING_COST = 5.00;

  window.addEventListener('load', init);
  let isMobile = window.matchMedia("(min-width: 992px)");
  isMobile.addListener(handleDeviceChange);

  async function init() {
    try {
      await loadCartCookie();
      await populatePage();
      // initial check
      handleDeviceChange(isMobile);
      changeIconBehavior();
      editCartBehavior();
      checkOut();
    } catch (error) {
      console.log("error at init")
      console.log(error);
    }
  }

  /**
   * Populates the whole checkout page. If shopping cart is empty, reveal the empty-cart div and
     hide the checkout/summary div. Otherwise, populate page normally.
   */
  async function populatePage() {
    if (shopping_cart_array.length < 1) {
      qs('.empty-cart').classList.remove('hidden');
      qs('.split-container').classList.add('hidden');
    } else {
      qs('.empty-cart').classList.add('hidden');
      qs('.split-container').classList.remove('hidden');

      id('loading').classList.remove('hidden');
      await populateCheckout();
      await populateSummary();
      id('loading').classList.add('hidden');
    }
  }

  /**
   * Takes in Stripe product_id and outputs the default_price for the given
   * product
   * @param {*} product_id
   * @returns The default_price, which is an ID used to get the price of a
   * product
   */
  async function getDefaultPrice(product_id) {
    let res = await fetch('/retrieve-product?id=' + product_id);
    await statusCheck(res);
    res = await res.json();
    return res.default_price;
  }

  /**
   * Handles the checkout behavior.
   */
  function checkOut() {
    let check_btn = id('checkout-btn');
    check_btn.addEventListener('click', checkOutHelper);
  }

  /**
   * Fetch POST a JSON Array of all the items in shopping_cart, retrieves back
   * a Stripe checkout URL, and redirects the site to that URL.
   */
  async function checkOutHelper() {
    try {
      // Switch to loading logo
      this.innerHTML = '';
      let spinning_logo = gen('img');
      spinning_logo.src = 'img/rolling.svg';
      spinning_logo.setAttribute('id', 'rolling');
      this.appendChild(spinning_logo);

      // line_items is the JSON Array that will be populated by shopping_cart
      let line_items = [];
      for (let i = 0; i < shopping_cart_array.length; i++) {
        let default_price = await getDefaultPrice(shopping_cart_array[i].id);
        line_items.push(
          {price: default_price, quantity: shopping_cart_array[i].quantity}
        )
      }

      let res = await fetch('/create-checkout-session', {
        method: 'POST',
        // * Indicates that the request body format is JSON.
        headers: {
          'Content-Type' : 'application/json',
        },
        body: JSON.stringify(line_items)
      });
      await statusCheck(res);
      // & res will return a Stripe checkout URL
      res = await res.text();
      location.assign(res);
    } catch (error) {
      console.log("error at checkouthelper")
      console.log(error);
    }
  }

  /**
   * This function updates the cookie with shopping_cart_array everytime an item
   * is added to cart.
   */
  function saveCookie() {
    Cookies.set('cart_info', JSON.stringify(shopping_cart_array), { expires: 7 });
  }

  /**
   * Handles cart editing behavior, allowing users to add, decrease, or remove
   * products from their shopping cart.
   */
  function editCartBehavior() {
    let plusButton = qsa('.plus');
    let minusButton = qsa('.minus');
    let removeButton = qsa('.trash');

    for (let i = 0; i < plusButton.length; i++) {
      plusButton[i].addEventListener('click', plusCart);
    }

    for (let i = 0; i < plusButton.length; i++) {
      minusButton[i].addEventListener('click', minusCart);
    }

    for (let i = 0; i < removeButton.length; i++) {
      removeButton[i].addEventListener('click', removeItem);
    }
  }

  /**
   * Removes item from shopping cart when the trash icon is clicked
   */
  function removeItem() {
    let product_id = this.id;
    let found_index = shopping_cart_array.findIndex((i) => i.id === product_id);
    if (found_index > -1) {
      shopping_cart_array.splice(found_index, 1);
      console.log('removed item');
    }
    saveCookie();
    location.reload();
  }

  /**
   * Increases quantity to the selected item when the plus icon is clicked.
   */
  function plusCart() {
    let product_id = this.id;
    let found_index = shopping_cart_array.findIndex((i) => i.id === product_id);
    if (found_index > -1) {
      shopping_cart_array[found_index].quantity++;
      console.log('quantity = ' + shopping_cart_array[found_index].quantity);
    }
    saveCookie();
    location.reload();
  }

  /**
   * Decreases quantity to the selected item when the minus icon is clicked.
   * Removes item from the cart
   */
  function minusCart() {
    let product_id = this.id;
    let found_index = shopping_cart_array.findIndex((i) => i.id === product_id);
    if (found_index > -1) {
      shopping_cart_array[found_index].quantity--;
      console.log('quantity = ' + shopping_cart_array[found_index].quantity);
      // & Remove item from shopping cart if quantity is less than 1
      if (shopping_cart_array[found_index].quantity < 1) {
        shopping_cart_array.splice(found_index, 1);
        console.log('removed item');
      }
    }
    saveCookie();
    location.reload();
  }

  /**
   * Calculates the total cost of all the items in shopping_cart_array + tax +
   * shipping
   */
  async function populateSummary() {
    let totalProductCost = 0;

    for (let i = 0; i < shopping_cart_array.length; i++) {
      totalProductCost = parseInt(totalProductCost) + parseInt(priceTimesQuantity(shopping_cart_array[i]));

      // * Populate products
      let h2title = gen('h2');
      let h2price = gen('h2');
      h2title.textContent = shopping_cart_array[i].title + ' (' + shopping_cart_array[i].quantity + ')';
      h2price.textContent = '$' + priceTimesQuantity(shopping_cart_array[i]);
      let productSummary = gen('div');
      productSummary.classList.add('summary');
      productSummary.appendChild(h2title);
      productSummary.appendChild(h2price);

      qs('main .right-side').appendChild(productSummary);
    }

    // let productCostWithTax = totalProductCost * TAX_RATE.toFixed(2);
    // let taxCost = (productCostWithTax - totalProductCost).toFixed(2);

    // * Populate blank line
    let blankLine = gen('br');

    // * Populate tax
    // let h2taxTitle = gen('h2');
    // h2taxTitle.textContent = 'Sales Tax (10%)';
    // let h2tax = gen('h2');
    // console.log('totalProductCost = ' + totalProductCost);
    // h2tax.textContent = '$' + taxCost;
    // let taxSummary = gen('div');
    // taxSummary.classList.add('summary');
    // taxSummary.appendChild(h2taxTitle);
    // taxSummary.appendChild(h2tax);

    // * Populate shipping cost
    // let h2shippingTitle = gen('h2');
    // h2shippingTitle.textContent = 'Shipping';
    // let h2shippingCost = gen('h2');
    // h2shippingCost.textContent = '$' + SHIPPING_COST.toFixed(2);
    // let shippingSummary = gen('div');
    // shippingSummary.classList.add('summary');
    // shippingSummary.appendChild(h2shippingTitle);
    // shippingSummary.appendChild(h2shippingCost);

    // * Populate hr
    let hr = gen('hr');
    hr.setAttribute('id', 'no-margin-hr');

    // * Populate estimated total
    let h2totalTitle = gen('h2');
    h2totalTitle.textContent = 'Total';
    let h2totalCost = gen('h2');
    h2totalCost.textContent = '$' + (totalProductCost).toFixed(2);
    let totalCostDiv = gen('div');
    totalCostDiv.classList.add('summary');
    totalCostDiv.setAttribute('id', 'bold');
    totalCostDiv.appendChild(h2totalTitle);
    totalCostDiv.appendChild(h2totalCost);
    let h2Description = gen('h2');
    h2Description.textContent = '(Excluding taxes + shipping)';

    // * Putting everything inside .right-side
    qs('main .right-side').appendChild(blankLine);
    // qs('main .right-side').appendChild(taxSummary);
    // qs('main .right-side').appendChild(shippingSummary);
    qs('main .right-side').appendChild(hr);
    qs('main .right-side').appendChild(totalCostDiv);
    qs('main .right-side').appendChild(h2Description);

    // * Inserting the two buttons
    qs('main .right-side').innerHTML += '<div class="btn">' +
    '<button type="button" id="back-to-shopping" onclick="location.href=' + "'shop.html'" + '"' +
    '>BACK TO SHOPPING</button>' + '<button type="button" id="checkout-btn"' + '>CHECKOUT' + '</button></div>';
  }

  /**
   * Takes in a product object in shopping_cart_array and outputs the corresponding
   * object's price * quantity in 2 decimal places.
   * @param {shopping_cart_array object} e
   * @returns {Number} Corresponding object's price * quantity in 2 decimal places.
   */
  function priceTimesQuantity(e) {
    return (parseFloat(e.price.replace("$", "")) * parseInt(e.quantity)).toFixed(2);
  }

  /**
   * This function uses shopping_cart_array and fetch('/retrieve-product) to
   * populate items from the shopping cart
   */
  async function populateCheckout() {
    console.log('got in')
    try {
      if (shopping_cart_array.length > 0) {
        let image;
        let title;
        let price;
        let quantity;

        let res;
        let product_id;
        for (let i = 0; i < shopping_cart_array.length; i++) {
          // ~As of now, the image URL is retrieved through the backend API.
          // ~The rest of the product info is retrieved through shopping_cart_array
          product_id = shopping_cart_array[i].id;
          res = await fetch('/retrieve-product?id=' + product_id);
          await statusCheck(res);
          res = await res.json();

          image = res.images;
          title = shopping_cart_array[i].title;
          price = shopping_cart_array[i].price;
          console.log("price: " + shopping_cart_array[i].price)
          quantity = shopping_cart_array[i].quantity;

          let items_container = gen('div');
          items_container.classList.add('items-container');

            let img = gen('img');
            img.src = image;
            img.alt = title;
            img.classList.add('product-img');
            img.classList.add('flex');

            let imgLink = gen('a');
            imgLink.href= '/product?id=' + product_id;
            imgLink.appendChild(img);

            // let h3title = gen('h3');
            // h3title.textContent = title;
            // h3title.classList.add('flex');
            let titleLink = gen('a');
            titleLink.href = '/product?id=' + product_id;
            titleLink.textContent = title;
            titleLink.classList.add('flex');
            titleLink.setAttribute('href', '/product?id=' + product_id);
            titleLink.setAttribute('id', 'can-hide');


            let h3price = gen('h3');
            h3price.classList.add('flex');
            // h3price.textContent = '$' + parseFloat(price.substring(1, price.length)).toFixed(2);
            h3price.textContent = '$' + parseFloat(price.replace("$", "")).toFixed(2)

            let mobile_container = gen('div');
            mobile_container.classList.add('mobile-container');
            mobile_container.classList.add('hidden');
            mobile_container.classList.add('flex');

            // let h3title_copy = h3title.cloneNode(true);
            // h3title_copy.classList.remove('flex');
            let titleLink_copy = titleLink.cloneNode(true);
            titleLink_copy.classList.remove('flex');

            let h3price_copy = h3price.cloneNode(true);
            h3price_copy.classList.remove('flex');

            // mobile_container.appendChild(h3title_copy);
            mobile_container.appendChild(titleLink_copy);
            mobile_container.appendChild(h3price_copy);

            let btn_container = gen('div');
            btn_container.classList.add('btn-container');

              let minus = gen('img');
              minus.src = 'img/minus1.png';
              minus.alt = 'minus';
              minus.classList.add('minus');
              minus.setAttribute('id', product_id);
              btn_container.appendChild(minus);

              let h3quantity = gen('h3');
              h3quantity.textContent = quantity;
              btn_container.appendChild(h3quantity);

              let plus = gen('img');
              plus.src = 'img/plus1.png';
              plus.alt = 'plus';
              plus.classList.add('plus');
              plus.setAttribute('id', product_id);
              btn_container.appendChild(plus);

              let trashDiv = gen('div');
              let trash_icon = gen('img');
              trash_icon.src = 'img/trash2.png';
              trash_icon.classList.add('trash');
              trash_icon.setAttribute('id', product_id);
              trashDiv.classList.add('flex');
              trashDiv.appendChild(trash_icon);

              items_container.appendChild(imgLink);
              // items_container.appendChild(h3title);
              items_container.appendChild(titleLink);
              items_container.appendChild(h3price);
              items_container.appendChild(mobile_container);
              items_container.appendChild(btn_container);
              items_container.appendChild(trashDiv);


          qs('main .main-container').appendChild(items_container);
        }
      }
    } catch (error) {
      console.log("error at populatecheckout")
      console.log(error);
    }
  }

  /**
   * This function changes the plus/minus icon to a different color when
   * the mouse is hovered on / out.
   */
  function changeIconBehavior() {
    let imgList = document.querySelectorAll('main .items-container .btn-container img');
    for (let i = 0; i < imgList.length; i++) {
      imgList[i].addEventListener('mouseover', changeIcon);
      imgList[i].addEventListener('mouseout', changeIcon);
    }
  }

  /**
   * Changes between two plus/minus icons
   */
  function changeIcon() {
    console.log('change icon');
    let iconName = this.src.split('/').pop();
    if (iconName.includes('2')) {
      this.src = 'img/' + iconName.replace('2','1');
      this.alt = this.src;
    } else {
      this.src = 'img/' + iconName.replace('1','2');
      this.alt = this.src;
    }
  }

  /**
   * Loads the cart_info cookie and fills in shopping_cart_array with the cookie.
   */
  async function loadCartCookie() {
    let cartInfo = Cookies.get('cart_info');
    if (cartInfo) {
      cartInfo = JSON.parse(cartInfo);
      shopping_cart_array = cartInfo;
    }
  }

  /**
   * Enables mobile mode if the screen size is below a certain width. Disables
   * if the opposite happens.
   * @param {e} The screen dimension
   */
  function handleDeviceChange(e) {
    if (e.matches) {
      console.log('mobile disabled');
      disableMobile();
    } else {
      console.log('mobile enabled');
      enableMobile();
    }
    qs('.split-container').classList.remove('invisible');
  }

  /**
   * Enables mobile mode
   */
  function enableMobile() {
    // Adds hidden to the old h3
    let selector = qsa('.items-container > h3, .items-container > #can-hide');
    for (let i = 0; i < selector.length; i++) {
      selector[i].classList.add('hidden');
    }

    // Removes hidden from the mobile div
    selector = qsa('.items-container > .mobile-container.hidden');
    for (let i = 0; i < selector.length; i++) {
      selector[i].classList.remove('hidden');
    }
  }

  /**
   * Disables mobile mode
   */
  function disableMobile() {
    // Removes hidden from the old h3
    let selector = qsa('.items-container > h3.hidden, .items-container > a.hidden');
    for (let i = 0; i < selector.length; i++) {
      selector[i].classList.remove('hidden');
    }
    // Adds hidden to the mobile div
    selector = qsa('.items-container > .mobile-container');
    for (let i = 0; i < selector.length; i++) {
      selector[i].classList.add('hidden');
    }
  }

  /**
   * Inserts newNode after referenceNode
   * @param {New Element} newNode
   * @param {Selector} referenceNode
   */
  function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  }

  /**
   * Takes in a promise object and checks if the promise request succeeded.
   * Throws a new error if the request did not succeed.
   * @param {response} response - A promise object
   * @return {Promise} A promise object
   */
  async function statusCheck(response) {
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return response;
  }

  /**
   * Returns the array of elements that match the given CSS selector.
   * @param {string} query - CSS query selector
   * @returns {object[]} array of DOM objects matching the query.
   */
  function qsa(query) {
    return document.querySelectorAll(query);
  }

  /**
   * Returns the first element that matches the given CSS selector.
   * @param {string} query - CSS query selector.
   * @return {object[]} array of DOM objects matching the query.
   */
  function qs(query) {
    return document.querySelector(query);
  }

  /**
   * Takes in a given tag and creates a new tag element
   * @param {HTMLElement} tag - the given tag
   * @return {HTMLElement} a new tag element
   */
  function gen(tag) {
    return document.createElement(tag);
  }

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} id - element ID
   * @return {object} DOM object associated with id.
   */
  function id(id) {
    return document.getElementById(id);
  }

})();