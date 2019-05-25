const url = '/';
const urlCart = '/cart';
const urlOrder = '/order';

const request = (options, cb) => {
  $.ajax(options)
    .done(response => {
      cb(response);
    })
    .fail(err => console.log('Error', err))
    .always(() => console.log('Request completed.'));
};

const calculateTotal = cartArray => {
  const priceArray = [];
  for (const keyID of cartArray) {
    let quantity = keyID.quantity;
    let price = keyID.price;
    priceArray.push(Number(quantity) * Number(price));
  }
  if (priceArray.length === 0) {
    return 0;
  } else {
    return priceArray.reduce((a, b) => a + b);
  }
};

const calculateTaxes = subtotal => {
  return subtotal*0.15
}
const round = number => {
  return Math.round(number * 100) / 100
}

const displayCart = function(foodObj, items) {
  const $article = $('<article>')
    .attr('id', foodObj.id);
  const $amount = $('<div>')
    .addClass('amount');
  const $add = $('<i>')
    .addClass('fas fa-plus-circle')
    .on('click', function(event) {
      event.preventDefault();
      $.ajax({
        url: '/cart/quantity',
        method: 'POST'
      }).done(function() {
        const cart = JSON.parse(({ ...localStorage }.cart)); 
        console.log(cart);
        for (var i = 0; i < cart.length; i++) {
          console.log(cart[i].id, foodObj.id);
          if (cart[i].id === foodObj.id) {
            cart[i].quantity = (cart[i].quantity + 1);
            localStorage.setItem('cart', JSON.stringify(cart));
          }
        } 
        let subtotal = round(calculateTotal(JSON.parse({ ...localStorage }.cart)));
        $('.subtotal').text('Subtotal: $' + subtotal);
        let taxes = round(calculateTaxes(calculateTotal(JSON.parse({ ...localStorage }.cart))));
        $('.taxes').text('Taxes: $' + taxes);
        $('.total').text('Total: $' + round((subtotal+taxes)))
        let items = { ...localStorage };
        $('#cartitems').empty();
        items = JSON.parse(items.cart);
        renderFoods(items);
      
        //     return localStorage.setItem('cart', JSON.stringify(cart2));
        // const addQuantity = $('#' + foodObj.id).find('.quantity').text();
        // const newQuantity = (Number(addQuantity) + 1)
        // $('.amount').find('.quantity').text(newQuantity);
      });
    });
  const $quantity = $('<span>')
    .addClass('quantity')
    .text(foodObj.quantity);
  const $remove = $('<i>')
    .addClass('fas fa-minus-circle') 
    .on('click', function(event) {
      event.preventDefault();
      $.ajax({
        url: '/cart/quantity',
        method: 'POST'
      }).done(function() {
        const cart = JSON.parse({ ...localStorage }.cart);
        const removeQuantity = $('#' + foodObj.id).find('.quantity').text();
        const foodName = $('.foodName').text();
        //need condition if === 0
        const newQuantity = (Number(removeQuantity) - 1);
        $('.amount').find('.quantity').text(newQuantity);
      });
    });
  const $foodName = $('<div>')
    .addClass('foodName')
    .text(foodObj.name);
  const $price = $('<div>')
    .addClass('price')
    .text('$' + foodObj.price);
  const $delete = $('<i>')
    .addClass('fas fa-times-circle')
    .on('click', function(event) {
      event.preventDefault();
      $.ajax({
        url: '/cart',
        method: 'DELETE'
      }).done(function() {
        const clear = { ...localStorage };
        const clearReal = JSON.parse(clear.cart);
        let cleared = clearReal.filter(obj => obj.name !== foodObj.name);
        localStorage.setItem('cart', JSON.stringify(cleared));
        foodArray = [clearReal];
        $('#cartitems').empty();
        let subtotal = round(calculateTotal(JSON.parse({ ...localStorage }.cart)));
        $('.subtotal').text('Subtotal: $' + subtotal);
        let taxes = round(calculateTaxes(calculateTotal(JSON.parse({ ...localStorage }.cart))));
        $('.taxes').text('Taxes: $' + taxes);
        $('.total').text('Total: $' + round((subtotal+taxes)) )
        renderFoods(cleared);
      });
    });
  
  $amount.append($add);
  $amount.append($quantity);
  $amount.append($remove);
  $article.append($amount);
  $article.append($foodName);
  $article.append($price);
  $article.append($delete);
  $('#cartitems').append($article);
  return $('#cartitems');
};


const addItemToStorage = foodObj => {
  if (!localStorage.cart) {
    let foodArray = [];
    foodObj.quantity = 1;
    foodArray.push(foodObj);
    localStorage.setItem('cart', JSON.stringify(foodArray));
  } else {    
    const cart2 = JSON.parse(({...localStorage}.cart));  
      for (var i = 0; i < cart2.length; i++) {
        if (cart2[i].name === foodObj.name) {
          cart2[i].quantity = (cart2[i].quantity + 1);
          return localStorage.setItem('cart', JSON.stringify(cart2));
        }  
      } 
      foodObj.quantity = 1;
      cart2.push(foodObj);
      localStorage.setItem('cart', JSON.stringify(cart2)); 
  }
};

const renderFoods = itemsArray => {
  for (const foodObj of itemsArray) {
    $('#cartitems').append(displayCart(foodObj, itemsArray));
  }
};

$(function() {
  $(this).scrollTop(0);

  $('main article').on('click', function(event) {
    event.preventDefault();
    const foodID = $(this).attr('class');
    $.ajax({
      method: 'POST',
      url: '/cart',
      data: foodID
    })
      .done(response => {
        addItemToStorage(response[0]);
        let subtotal = round(calculateTotal(JSON.parse({...localStorage}.cart)));
        $('.subtotal').text('Subtotal: $' + subtotal);
        let taxes = round(calculateTaxes(calculateTotal(JSON.parse({ ...localStorage }.cart))));
        $('.taxes').text('Taxes: $' + taxes);
        $('.total').text('Total: $' + round((subtotal+taxes)) )
        let items = { ...localStorage };
        $('#cartitems').empty();
        items = JSON.parse(items.cart);
        renderFoods(items);
      })
      .fail(error => {
        console.log(`Error: ${error}`);
      })
      .always(() => {
        console.log('Request completed');
      });
  });

     

  $('.placeOrder').on('submit', function(event) {
    event.preventDefault();
    const $name = $(this)
      .find("input[name='name']")
      .val();
    const $phone = $(this)
      .find("input[name='phone']")
      .val();
    const $cartItems = JSON.parse(localStorage.cart);

    $.ajax({
      method: 'POST',
      url: '/order',
      data: {
        name: $name,
        phone: $phone,
        cartItems: $cartItems
      }
    })
      .done(response => {
        $('#cartitems').empty();
        $('#cart').text('Thank you for your order');
        localStorage.clear();
      })
      .fail(error => {
        console.log(`Order Post Error: ${error}`);
      })
      .always(() => {
        console.log('Order Post completed.');
      });
  });
});
