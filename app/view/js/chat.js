populateCountries("country", "state");
// Save filter button
$(document).on('click', '#save', function (e) {
  console.log("save");
  $("#filter .dropdown-menu").removeClass('show');
});
// Cancel filter button
$(document).on('click', '#cancel', function (e) {
  $("#filter .dropdown-menu").removeClass('show');
});

// Disable auto close of dropdown menu when click inside the menu
$(document).on('click', '.dropdown-menu', function (e) {
  e.stopPropagation();
});

$(function() {
  this.$paired = false;
  let socket = io.connect('http://localhost:8000', {
    query : {
      user_type:"guest"
    }
  });
  let user_data = JSON.parse(sessionStorage.user_data);
  
  $(document).ready(function() {
    // Show loading spinner, hide main section
    $(".connecting-loader").css({'display':'block'});
    $('section').css({'filter': 'blur(58px)', '-webkit-filter': 'blur(58px)'});
    // Set emoji picker
    $(".msg-txt").emojioneArea({
      pickerPosition: "top",
      filtersPosition: "bottom",
      events: {
        keyup: function (editor, event) {
          console.log(editor.text());
          if (editor.text()) {
            // enter was pressed
            socket.emit('MESSAGE_TYPING');
          }
          else {
            socket.emit('MESSAGE_DONE_TYPING');
          }
          if (event.keyCode === 13) {
            chat.sendMessage();
          }
        },
      }
    });
  });
  // Change the filter
  $(document).on('click', '#save', function (e) {
    // Show loading spinner, hide main section
    // $(".connecting-loader").css({'display':'block'});
    // $('section').css({'filter': 'blur(58px)', '-webkit-filter': 'blur(58px)'});
    var pre_gender = $('input[name="pre-gender"]:checked').val();
    var pre_age_from = parseInt($(".noUi-handle.noUi-handle-lower").text());
    var pre_age_to = parseInt($(".noUi-handle.noUi-handle-upper").text());
    let data = {
      pre_gender: pre_gender,
      pre_age_from: pre_age_from,
      pre_age_to: pre_age_to
    }
    socket.emit('ON_CHNAGE_FILTER', data);
  });
  // Find the next user
  $(document).on('click', '#nextuser', function (e) {
    // Show loading spinner, hide main section
    $(".connecting-loader").css({'display':'block'});
    $('section').css({'filter': 'blur(58px)', '-webkit-filter': 'blur(58px)'});
    
    socket.emit('ON_NEXT_PAIR');
  });

  socket.on("CONNECTION_ACCEPTED", () => {
    console.log("connected to server");
    // Send socket connection request,
    socket.emit('ON_CONFIRM_NAME', user_data);
  });
  socket.on("USER_CONFIRMED", (data) => {
    // Hide loading spinner, remove main section blur
    // $(".connecting-loader").css({'display':'none'});
    // $('section').css({'filter': '', '-webkit-filter': ''});
    console.log("user confirmed", data);
    socket.emit('ON_FIND_PAIR');
  });
  // On paired
  socket.on("ON_PAIRED", (data) => {
      console.log("ON_PAIRED", data);
      $('.send-btn').attr('disabled', false);
      $('.send-btn').css('color', '#1dc4e9');
      $('.send-btn').css('pointer-events', 'default');
      $(".connecting-loader").css({'display':'none'});
      $('section').css({'filter': '', '-webkit-filter': ''});
      $('.chat-history ul').html('');
      this.$paired = true;
      Swal.fire(
        'Success!',
        'You have a new user ' + data.username + '! You can start chating now!',
        'success'
      )
  });
  // On Pair Failed
  socket.on("ON_PAIRFAILED", (data) => {
      console.log("ON_PAIRFAILED", data);
      $('.send-btn').attr('disabled', true);
      $('.send-btn').css('color', '#ccc');
      $('.send-btn').css('pointer-events', 'none');
      $('.chat-history ul').html('');
      Swal.fire(
        'Failed!',
        "Sorry, We can't find the pair!Please Change the filter and try again!",
        'error'
      )
      $(".connecting-loader").css({'display':'none'});
      $('section').css({'filter': '', '-webkit-filter': ''});
  });
  // On Receive New Message
  socket.on("NEW_MESSAGE", (data) => {
    console.log("ON NEW MESSAGE", data);
    chat.addResponseMsg(data.msg);
  });
  // On Typing Message
  socket.on("MESSAGE_TYPING", (data) => {
    console.log("Typing");
    chat.addTyping();
  });
  // On Done Typing Message
  socket.on("MESSAGE_DONE_TYPING", (data) => {
    console.log("Done typing");
    chat.doneTyping();  
  });
  // On Left Chat
  socket.on("LEFT_CHAT", (data) => {
    console.log("Left Chat");
    Swal.fire({
      title: 'Your partner left the conversation',
      text: "Would you like to search another partner?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Search!'
    }).then((result) => {
      if (result.value) {
        $(".connecting-loader").css({'display':'block'});
        $('section').css({'filter': 'blur(58px)', '-webkit-filter': 'blur(58px)'});
        
        socket.emit('ON_NEXT_PAIR');
      }
    })
  });
  
  var chat = {
    messageToSend: '',
    init: function() {
      this.cacheDOM();
      this.bindEvents();
    },
    cacheDOM: function() {
      this.$chatHistory = $('.chat-history');
      this.$button = $('.send-btn');
      this.$textinput = $('.msg-txt');
      this.$chatHistoryList =  this.$chatHistory.find('ul');
      this.$typing = false;
    },
    bindEvents: function() {
      this.$button.on('click', this.sendMessage.bind(this));
    },
    addResponseMsg: function(msg) {
      this.doneTyping();
      // responses
      var templateResponse = Handlebars.compile( $("#message-response-template").html());
      var contextResponse = { 
        response: msg
        // name: "Receiver"
      };
      
      setTimeout(function() {
        this.$chatHistoryList.append(templateResponse(contextResponse));
        this.scrollToBottom();
      }.bind(this), 400);
    },
    addTyping: function() {
      // responses
      console.log(this.$typing);
      if (this.$typing == false) {
        var templateResponse = Handlebars.compile( $("#message-response-typing").html());
        
        setTimeout(function() {
          this.$chatHistoryList.append(templateResponse());
          this.scrollToBottom();
        }.bind(this), 400);
        this.$typing = true;
      }
    },
    doneTyping: function() {
      // responses
      $('.typing').remove();
      this.$typing = false;
    },
    sendMessage: function() {
      console.log("aaa", $('.send-btn').attr('disabled'));
      if ($('.send-btn').attr('disabled') == 'disabled')
        return false;
      console.log(this.$paired);
      this.messageToSend = this.$textinput[0].emojioneArea.getText();
      if (this.messageToSend.trim() !== '') {
        var template = Handlebars.compile( $("#message-template").html());
        var context = { 
          messageOutput: this.messageToSend
          // name: "Sender"
        };
        
        this.$chatHistoryList.append(template(context));
        this.scrollToBottom();
        this.$textinput[0].emojioneArea.setText('');

        socket.emit('ON_NEW_MESSAGE', { 
          msg: this.messageToSend,    // Text Message Content
          img: null,                  // Message Image URL
          vid: null                   // Message Video URL
        });
      }
      // this.render();
    },
    scrollToBottom: function() {
      this.$chatHistory.scrollTop(this.$chatHistory[0].scrollHeight);
    },
  };
  
  chat.init();
  
});