populateCountries("country", "state" ,"Anywhere", "Anywhere");
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

$(function() { //18.177.142.61
  let socket = io.connect('http://18.177.142.61:8000', {
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
    var pre_country = $('#country').find(":selected").text();
    var pre_state = $('#state').find(":selected").text();
    
    let data = {
      pre_gender: pre_gender,
      pre_age_from: pre_age_from,
      pre_age_to: pre_age_to,
      pre_country: pre_country,
      pre_state: pre_state,
    }
    if ($('.send-btn').attr('disabled') == 'disabled')
      data.paired = false;
    else
    data.paired = true;
    
    socket.emit('ON_CHNAGE_FILTER', data);
  });
  // Find the next user
  $(document).on('click', '#nextuser', function (e) {
    // Show loading spinner, hide main section
    $(".connecting-loader").css({'display':'block'});
    $('section').css({'filter': 'blur(58px)', '-webkit-filter': 'blur(58px)'});
    if ($('.send-btn').attr('disabled') == 'disabled')
      socket.emit('ON_NEXT_PAIR', {paired: false});
    else
      socket.emit('ON_NEXT_PAIR', {paired: true});
  });
  $(document).on('change', '#img-file', function (e) {
    console.log("file1", this.files);
    if (this.files && this.files[0]) {
      console.log("file2", this.files[0]);
      var myFile = this.files[0];
      var reader = new FileReader();
      
      reader.onload = function (e) {
        var img_src = e.target.result;
        // console.log(img_src);
        var newImage = document.createElement('img');
        newImage.src = img_src;
        
        var chat_list = $('.chat-history').find('ul');
        chat_list.append('<li style="display: flex;justify-content: flex-end;margin-top: 10px;"><div class="message me">' + newImage.outerHTML + '</div></li>');
        
        $('.chat-history').scrollTop($('.chat-history')[0].scrollHeight + 500);

        socket.emit('ON_NEW_MESSAGE', { 
          msg: null,               // Text Message Content
          img: img_src,  // Message Image URL
        });
        console.log("emit");
      }
      
      reader.readAsDataURL(myFile);
    }
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
      $('#report-dropdown').css('color', '#1dc4e9');
      $('#report-dropdown').css('pointer-events', 'auto');

      $('.send-btn').attr('disabled', false);
      $('.send-btn').css('color', '#007bff');
      $('.send-btn').css('pointer-events', 'auto');
      $(".connecting-loader").css({'display':'none'});
      $('section').css({'filter': '', '-webkit-filter': ''});
      $('.chat-history ul').html('');
      Swal.fire(
        'Success!',
        'You have a new user ' + data.username + '! You can start chating now!',
        'success'
      )
  });
  // On Pair Failed
  socket.on("ON_PAIRFAILED", (data) => {
      console.log("ON_PAIRFAILED", data);
      $('#report-dropdown').css('color', '#ccc');
      $('#report-dropdown').css('pointer-events', 'none');

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
    chat.doneTyping();
    chat.addResponseMsg(data);
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
      console.log(result);
      if (result.value) {
        $(".connecting-loader").css({'display':'block'});
        $('section').css({'filter': 'blur(58px)', '-webkit-filter': 'blur(58px)'});
        
        socket.emit('ON_FIND_PAIR');
      }
      if (result.dismiss != "") {
        $('.send-btn').attr('disabled', true);
        $('.send-btn').css('color', '#ccc');
        $('.send-btn').css('pointer-events', 'none');
        $('.chat-history ul').html('');
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
      this.$img_button = $('.img-btn');
      this.$send_button = $('.send-btn');
      this.$textinput = $('.msg-txt');
      this.$chatHistoryList =  this.$chatHistory.find('ul');
      this.$typing = false;
    },
    bindEvents: function() {
      this.$send_button.on('click', this.sendMessage.bind(this));
      this.$img_button.on('click', this.sendImg.bind(this));
    },
    addResponseMsg: function(data) {
      this.doneTyping();
      // responses
      if (data.img == null) {
        var templateResponse = Handlebars.compile( $("#message-response-template").html());
        var contextResponse = { 
          response: data.msg
        };
        setTimeout(function() {
          this.$chatHistoryList.append(templateResponse(contextResponse));
          this.scrollToBottom();
        }.bind(this), 400);
      }
      else {
        var img_src = data.img;
        // console.log(img_src);
        var newImage = document.createElement('img');
        newImage.src = img_src;
        
        var chat_list = $('.chat-history').find('ul');
        chat_list.append('<li style="display: flex;margin-top: 10px;"><div class="message">' + newImage.outerHTML + '</div></li>');
        
        $('.chat-history').scrollTop($('.chat-history')[0].scrollHeight + 500);
      }      
      
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
          // isImg: false                // Message Video URL
        });
      }
      // this.render();
    },
    sendImg: function() {
      console.log("aaa", $('.send-btn').attr('disabled'));
      if ($('.send-btn').attr('disabled') == 'disabled')
        return false;
      $("#img-file").click();
    },
    scrollToBottom: function() {
      this.$chatHistory.scrollTop(this.$chatHistory[0].scrollHeight + 500);
    },
  };
  
  chat.init();
  
});