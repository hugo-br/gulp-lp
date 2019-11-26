//////////////////////////////////////////////////////////////////
/**
 * UI
 */

$(document).ready(function() {



  // verification of data on typing
  $(".js-input").blur(function() {
    $(".form.error-message").empty();
    if ($(this).val()) {
      $(this).addClass("used");
      var inputType = $(this).attr("data-input");
      var val = $(this)
        .val()
        .trim();
      var that = $(this);
      verifyValue(inputType, val, that);
    } else {
      $(this)
        .removeClass("used")
        .removeClass("error")
        .removeClass("good")
        .siblings(".messages")
        .text("")
        .removeClass("error");
    }
  });

  // show/hide hint
  $(".js-hint").on("click", function() {
    var element = $(this).siblings(".hiding-help");
    element.hasClass("show-hint") === true
      ? element.removeClass("show-hint")
      : element.addClass("show-hint");
  });

  $(".js-close-hint").click(function() {
    $(this)
      .parent(".hiding-help")
      .removeClass("show-hint");
  });

  // submit form
  $(".js-submit").click(function(e) {
    e.preventDefault();
    verifyForm($(this));
  });


    // fix bug if prefill
    $(".js-input").each(function(){
      if ($(this).val()) {
        $(this).blur();
      }
    });

});

/**
 *
 * Functions to show or hide the submit button
 */

function showLoading(element) {
  element.siblings(".form.load").addClass("process");
  element.addClass("process").addClass("process");
}

function removeLoading(element) {
  element.siblings(".form.load").removeClass("process");
  element.addClass("process").removeClass("process");
}

//////////////////////////////////////////////////////////////////
/**
 * Function for verification
 * Return true or false
 */

var errorMessages = {
  "first-name": {
    en: "Invalid format",
    fr: "Non valide"
  },
  "last-name": {
    en: "Invalid format",
    fr: "Non valide"
  },
  postal: {
    en: "Please enter a valid zip/postal code",
    fr: "Non valide"
  },
  phone: {
    en: "Please enter a valid phone number",
    fr: "tetsRF"
  },
  email: {
    en: "Please enter a valid email format",
    fr: ""
  },
  "order-number": {
    en: "Please enter a valid store or online transaction number",
    fr: "tetsRF"
  },
  missing: {
    en: "*Required field.",
    fr: "Veuillez entrez une valeur"
  },
  invalidEmail: {
    en: "This is an invalid email. Please use a valid one.",
    fr: "Veuillez utilisez une addresse valide."
  },
  alreadyOrder: {
    en: "This order has been already been register",
    fr: "Cette commande a deja ete utilise"
  },
  alreadyEmail: {
    en : "This email address has already been register",
    fr : "Cette address couriel a deja ete utiliser"
  },
  terms :{
    en : "You must agree with the terms first",
    fr : "Veuillez accepter les termes en premier lieu"
  },
  errorTobeFix: {
    en: "You have some errors, please fix them before submitted the form",
    fr : "Vous avez des erreurs. Veuillez les fixer"
  }
};

/**
 * Verify all the form 
 * 
 */
function verifyForm(element) {
  var err = 0;
  var $messages = element.parents("form").find(".form.general-messages");
  $messages.removeClass("show").empty();
  var obj = {};

  // loop each mandatory input
  $(".js-input").each(function() {
    $(this)
      .siblings(".messages")
      .text("")
      .removeClass("error");
    var val = $(this)
      .val()
      .trim();
    // if field value is empty
    if (val === "" || !val) {
      $(this).addClass("error").addClass("missing");
      $(this)
        .siblings(".messages")
        .text(errorMessages["missing"]["en"])
        .addClass("error");
      err++;
    } else {
      var that = $(this);
      var inputType = $(this).attr("data-input");
      var v = verifyValue(inputType, val, that); // verify if it's the right format
      if (v === false) {
        err++;
      }
      obj[inputType] = val;
    }
  }); // @end loop


  if (err !== 0) {
  //  $messages.append("<p>You have " + err + " errors</p>").addClass("show");
    $messages.append("<p>" + errorMessages["errorTobeFix"]["en"] + "</p>").addClass("show");
    return false;
  }


  // checkbox agreement is checked
  if( $("#checkbox-agree:checked").length > 0 === true ) {
    element.parents("form.form").addClass("lock");
    showLoading(element);
    var email = obj['email']; // email
    var order = obj['order-number']; // order number

    // promises
    var promiseEmailAPI = new Promise(function(resolve, reject) {
      resolve(verifyEmailWithService(email));
    });

    var checkIfInDB = new Promise(function(resolve, reject) {
      resolve(verifyInDatabase(email));
    });

    var checkOrderInDB = new Promise(function(resolve, reject) {
      resolve(verifyOrder(order));
    });   
    
    // verification with APIs
    Promise.all([promiseEmailAPI, checkIfInDB, checkOrderInDB])
      .then(function(values) {
        var err2 = 0;

        // check email validation
        if (values[0]["status"] !== "OK" && values[0]["status"] !== "Unknown") {
          err2++;
          $messages.append("<p>" + errorMessages["invalidEmail"]["en"] + "</p>");
        }

        // check if email is in DB
        if(values[1]['total'] != 0) {
          err2++;
          $messages.append("<p>" + errorMessages["alreadyEmail"]["en"] + "</p>");
        }

        // check if order is in DB
        if(values[2]['total'] != 0) {
          err2++;
          $messages.append("<p>" + errorMessages["alreadyOrder"]["en"] + "</p>");
        }
        
        // if no errors
        if(err2 === 0) {
         
          // get the newsletters sign-ups 
          $("#checkbox-women:checked").length > 0 === true ? obj['sign-up-women'] = 1 : obj['sign-up-women'] = 0;
          $("#checkbox-men:checked").length > 0 === true ? obj['sign-up-men'] = 1 : obj['sign-up-men'] = 0;

            var promiseContest = new Promise(function(resolve, reject) {
              resolve(sendContestData(obj));
            });

            promiseContest.then(function(value) {
               console.log("SUCCESS :");
               console.log(value);
               if(value['state'] === 'Success') {
					successEntry(element);
               } else {
                console.log(value);
                unlockForm(element);
               }
               
            }).catch(function(reason) {
              console.log(reason);
              unlockForm(element);
              return false;
            });
        



        } else {
          unlockForm(element);
          return false;
        }

        
      }) 
      // error handing
      .catch(function(reason) {
        console.log(reason);
        unlockForm(element);
        return false;
      });
  } else {
    // must agree with terms
    $messages.append("<p>" + errorMessages["terms"]["en"] + "</p>").addClass("show");
    return false;
  }
}

// hide the show loading 
function unlockForm(element) {
  setTimeout(function(){
    removeLoading(element); 
    element.parents("form.form").removeClass("lock");
    element.parents("form").find(".form.general-messages").addClass("show");
  }, 1200); 
}

// succesful registration
function successEntry(element){
  element.parents("form.form").addClass("success");
  // https://codepen.io/loktar00/pen/fczsA
  // https://codepen.io/arcs/pen/XKKYZW

  setTimeout(function(){
    element.parents("form.form").empty().removeClass("lock");
   // removeLoading(element); 
   // element.parents("form.form").append("<div id='form-success'></div>");
  //  element.parents("form.form").removeClass("lock");
   // $(".form.row").addClass("hidden");
    buildSuccessPage();
  }, 1200); 
}

function buildSuccessPage(){
  $("form.form").append("<div id='form-success'><canvas id='birthday'></canvas></div>");
  $("#form-success").append("<h2>THANK YOU</h2>");

  var script = document.createElement('script');
  script.src = 'js/firework.js';
  document.head.appendChild(script);
}

// verify each value
function verifyValue(instruction, value, that) {
  // reset classes
  $(that)
    .removeClass("error")
    .removeClass("good")
    .removeClass("missing");
  var verif = false;
  $(that)
    .siblings(".messages")
    .text("")
    .removeClass("error");

  // verify the value with the good function
  switch (instruction) {
    case "first-name": {
      verif = verifyName(value);
      break;
    }

    case "last-name": {
      verif = verifyName(value);
      break;
    }

    case "phone": {
      verif = verifyPhone(value);
      break;
    }

    case "email": {
      verif = verifyEmail(value);
      break;
    }

    case "order-number": {
      verif = verifyOrderNumber(value);
      break;
    }
  }

  // add success or error message
  if (verif === false) {
    $(that).addClass("error");

    if (errorMessages[instruction]["en"]) {
      $(that)
        .siblings(".messages")
        .text(errorMessages[instruction]["en"])
        .addClass("error");
    }
    return false;
  } else {
    $(that).addClass("good");
    return true;
  }
}

// name
function verifyName(name) {
  if (name.length <= 1 || isNaN(name) === false) {
    return false;
  }
  return true;
}

// phone
function verifyPhone(number) {
  var patt = new RegExp(/^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}$/gm);
  return patt.test(number);
}

//email
function verifyEmail(email) {
  var patt = new RegExp(
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/gm
  );
  return patt.test(email);
}

// testing use: 0033322554512296
// order number
function verifyOrderNumber(order) {
  if (order.length !== 16) {
    console.log("length");
    return false;
  }
  if (order.substring(0, 2) != 0) {
    console.log("first 2 number");
    return false;
  }
  if (
    order.substring(2, 5) != 333 &&
    order.substring(2, 5) != 334 &&
    order.substring(2, 5) != 335 &&
    order.substring(2, 5) != 336
  ) {
    console.log("store number");
    return false;
  }
  //  }
  /*
  if (order.substring(11, 13) != 12) {
    console.log("!= 12");
    return false;
  }
*/
  if (order.substring(13, 16) == '000' || order.substring(13, 16) >= 367) {
    console.log("last 3 numbers");
    return false;
  }

  return true;
}

// email verification with API
function verifyEmailWithService(email) {
  var url =
    "https://exthost01.lechateau.com/email/emailCheckout.php?email=" +
    encodeURIComponent(email);

  return $.ajax({
    type: "GET",
    dataType: "json",
    url: url,
    success: function(data) {},
    error: function(msg) {}
  });
}

// check if email in database
function verifyInDatabase(email) {
  var url =
    "https://lechateaustyle.ca/rakesh/BFcontest19/get/email.php?email=" +
    encodeURIComponent(email);

  return $.ajax({
    type: "GET",
    dataType: "json",
    url: url,
    success: function(data) {},
    error: function(msg) {}
  });
}


// check order in database
function verifyOrder(order){
  var url =
    "https://lechateaustyle.ca/rakesh/BFcontest19/get/order.php?order=" +
    encodeURIComponent(order);

  return $.ajax({
    type: "GET",
    dataType: "json",
    url: url,
    success: function(data) {},
    error: function(msg) {}
  });
}

// send data
function sendContestData(arr){
  return $.post("https://lechateaustyle.ca/rakesh/BFcontest19/post/entry.php", { arr } ,
    function(data,status){
    });
}