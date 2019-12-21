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
  
  $(document).on('click', )

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
      $(".connecting-loader").css({'display':'none'});
      $('section').css({'filter': '', '-webkit-filter': ''});
      $('.chat-history ul').html('');
      this.$paired = true;
      Swal.fire(
        'Success!',
        'You have a new pair ' + data.username + '! You can start chating now!',
        'success'
      )
  });
  // On Pair Failed
  socket.on("ON_PAIRFAILED", (data) => {
      console.log("ON_PAIRFAILED", data);
      alert("Sorry, We can't find the pair!Please Change the filter and try again!");
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
      console.log("aaa");
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