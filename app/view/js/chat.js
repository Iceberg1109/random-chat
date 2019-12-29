populateCountries("country", "state" ,"Anywhere", "Anywhere");
// Cancel filter button
$(document).on('click', '#cancel', function (e) {
  $("#filter-dropdown").removeClass('show');
});

// Disable auto close of dropdown menu when click inside the menu
$(document).on('click', '.dropdown-menu', function (e) {
  e.stopPropagation();
});

$(function() { //18.177.142.61
  // let socket = io.connect('http://18.177.142.61:8000', {
  let socket = io.connect('http://localhost:8000', {
    query : {
      user_type:"guest"
    }
  });
  let user_data = JSON.parse(sessionStorage.user_data);
  var bTyping = false;
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
          console.log(bTyping);
          if (editor.text() && bTyping == false) {
            // enter was pressed
            socket.emit('MESSAGE_TYPING');
            bTyping = true;
          }
          else if (editor.text() == ""){
            socket.emit('MESSAGE_DONE_TYPING');
            bTyping = false;
          }
          if (event.keyCode === 13) {
            bTyping = false;
            chat.sendMessage();
          }
        },
      }
    });
  });
  // Change the filter
  $(document).on('click', '#save', function (e) {
    $("#filter-dropdown").removeClass('show');
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
      if (this.files[0].size > 5 * 1024 * 1024) {// Larger than 5 MB
        swal("Large Image", "Image size should be less than 5MB!", "error")
        return;
      }
      var myFile = this.files[0];
      var reader = new FileReader();
      
      reader.onload = function (e) {
        var img_src = e.target.result;
        // console.log(img_src);
        var newImage = document.createElement('img');
        newImage.src = img_src;
        
        var chat_list = $('.chat-history').find('ul');
        chat_list.append('<li style="display: flex;justify-content: flex-end;margin-top: 10px;"><div class="message me">' + newImage.outerHTML + '</div></li>');
        
        chat.scrollToBottom();

        socket.emit('ON_NEW_MESSAGE', { 
          msg: null,               // Text Message Content
          img: img_src,  // Message Image URL
        });
        console.log("emit");
      }
      
      reader.readAsDataURL(myFile);
      $('#img-file').val('');
    }
  });
  $(document).on('click', '.message img', function (e) {
    console.log("img click", $(this).attr("src"));
    $img = $(this).attr("src");
    $('#myModal img').attr('src', $img);
    $('#myModal').modal('toggle');
  });
  $(document).on('click', '.scammer', function(e){
    $("#right-menu .dropdown-menu").removeClass('show');
    socket.emit("REPORT_USER", {detail: $(this).text()});
  });
  socket.on("CONNECTION_ACCEPTED", () => {
    console.log("connected to server");
    // Send socket connection request,
    socket.emit('ON_CONFIRM_NAME', user_data);
  });
  socket.on("USER_CONFIRMED", (data) => {
    console.log("user confirmed", data);
    socket.emit('ON_FIND_PAIR');
  });
  // On paired
  socket.on("ON_PAIRED", (data) => {
      console.log("ON_PAIRED", data);
      $('#report-dropdown').css('color', '#f51212');
      $('#report-dropdown').css('pointer-events', 'auto');

      $('.send-btn').attr('disabled', false);
      $('.send-btn').css('color', '#007bff');
      $('.send-btn').css('pointer-events', 'auto');
      $(".connecting-loader").css({'display':'none'});
      $('section').css({'filter': '', '-webkit-filter': ''});
      $('.chat-history ul').html('');

      $('.alert-danger').css('display', 'none');
      $('.alert-success').css('display', 'block');
      $('.alert-success').text('You have successfully connected with ' + data.username + '! You can start chatting now.')
      $('.status-msg').text('Connected');

      $('#is-typing span').text(data.username);
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
      
      $('.alert-danger').html("We apologize but there are no other chat users matching your search criteria. Please search again or adjust your filter.<br>Click Next User to find a new partner.");
      $('.alert-danger').css('display', 'block');
      $('.alert-success').css('display', 'none');
      $('.status-msg').text('Disconnected');

      $(".connecting-loader").css({'display':'none'});
      $('section').css({'filter': '', '-webkit-filter': ''});
  });
  // On Receive New Message
  socket.on("NEW_MESSAGE", (data) => {
    console.log("ON NEW MESSAGE", data);
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
    $('.alert-danger').html("Your partner has left the chat.<br>Click Next User to find a new partner.");
    $('.alert-danger').css('display', 'block');
    $('.alert-success').css('display', 'none');
    $('.status-msg').text('Disconnected');

    $('#report-dropdown').css('color', '#ccc');
    $('#report-dropdown').css('pointer-events', 'none');

    $('.send-btn').attr('disabled', true);
    $('.send-btn').css('color', '#ccc');
    $('.send-btn').css('pointer-events', 'none');
    
    $('.chat-history ul').html('');
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
      chat.doneTyping();
      this.$typing = false;
      console.log(data.msg);
      // responses
      if (data.img == null) {
        // var templateResponse = Handlebars.compile( $("#message-response-template").html());
        // var contextResponse = { 
        //   response: data.msg
        // };
        // console.log("res msg", templateResponse(contextResponse));
        var new_msg = '<li style="display: flex;margin-top: 10px;"><div class="message">' + data.msg + '</div></li>';
        this.$chatHistoryList.append(new_msg);
        this.scrollToBottom();
      }
      else {
        var img_src = data.img;

        var newImage = document.createElement('img');
        newImage.src = img_src;
        
        var chat_list = $('.chat-history').find('ul');
        chat_list.append('<li style="display: flex;margin-top: 10px;"><div class="message">' + newImage.outerHTML + '</div></li>');
        
        chat.scrollToBottom();
      }      
    },
    addTyping: function() {
      // responses
      console.log(this.$typing);
      if (this.$typing == false) {
        $('#is-typing').css('display', 'flex');
        this.$typing = true;
      }
    },
    doneTyping: function() {
      // responses
      $('#is-typing').css('display', 'none');
      this.$typing = false;
    },
    sendMessage: function() {
      console.log("aaa", $('.send-btn').attr('disabled'));
      if ($('.send-btn').attr('disabled') == 'disabled')
        return false;
      
      this.messageToSend = this.$textinput[0].emojioneArea.getText();
      if (this.messageToSend.trim() !== '') {
        // var template = Handlebars.compile( $("#message-template").html());
        // var context = { 
        //   messageOutput: this.messageToSend
        // };
        
        var new_msg = '<li style="display: flex;justify-content: flex-end;margin-top: 10px;"><div class="message me">' + this.messageToSend + '</div></li>';
        this.$chatHistoryList.append(new_msg);
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
      this.$chatHistory.animate({
        scrollTop: this.$chatHistory[0].scrollHeight + 500,
      }, 200);
    },
  };
  
  chat.init();
  
});
