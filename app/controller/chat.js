
// Socket Array Saving All the new client sockets
var m_sockets = [];
// Socket Pair Object Array 
var pairs = [];

module.exports = {
    // When new guest joined to chatting, need to add to the guest list
    OnNewGuesJoined: function(socket) {
        // Add New Guest's socket to Sockets array
        console.log("New Connection");
        console.log(m_sockets.length);
        console.log(pairs.length);
        m_sockets.push(socket);
        console.log(m_sockets.length);
        console.log(pairs.length);
        socket.emit("CONNECTION_ACCEPTED");
    },

    // Guest confirm his user name
    OnConfirmJoin: function(socket, user_data) {
        m_sockets.forEach(element => {
            if(element.id == socket.id)
                element.user_data = user_data;
        });
        
        socket.emit("USER_CONFIRMED", user_data.name);
    },

    // When a user searches his pair
    OnCreateNewPair: function(socket, cur_id) {
        // Pull 2 sockets including requested socket, and idle socket and pair it
        console.log("Create Pair");
        console.log(m_sockets.length);
        console.log(pairs.length);
        var ind1 = 0, ind2=0;
        var dif_found = false, same_found = false;
        var res_sock;
        var me;
        var paired = false;
        // Find me
        m_sockets.forEach(element => {
            if(element.id == socket.id){
                element.isSearching = true;
                me = element;
                return;
            }
        });
        // Find pair
        // console.log("Me id: ", me.id);
        m_sockets.forEach(element => {
            console.log(element.user_data);
            if( element.id != me.id && element.isSearching && element.id != cur_id
                && element.user_data.age >= me.user_data.pre_age_from
                && element.user_data.age <= me.user_data.pre_age_to
                && element.user_data.gender == me.user_data.pre_gender) {
                // Add new pair to pairs
                pairs.push({f: me, s:element});
                dif_found = true;
                res_sock = element;
            } else if(element.id == me.id){
                same_found = true;
                element.isSearching = true;
            }

            if(!dif_found)
                ind1 ++;
            if(!same_found)
                ind2 ++;
            if(dif_found && same_found) {
                // Remove added pair from client sockets array
                if(ind1>ind2){
                    m_sockets.splice(ind1, 1);
                    m_sockets.splice(ind2, 1);
                    paired = true;
                } else if (ind1 < ind2) {
                    m_sockets.splice(ind2, 1);
                    m_sockets.splice(ind1, 1);
                    paired = true;
                }
                return;
            }
        });
        console.log(m_sockets.length);
        console.log(pairs.length);
        // Send Search Result to both Sides
        if(paired){
            // console.log(res_sock.user_data.name);
            // console.log(me.user_data.name);
            socket.emit("ON_PAIRED", { username: res_sock.user_data.name, pair_id: res_sock.id });
            res_sock.emit("ON_PAIRED", { username: me.user_data.name, pair_id: socket.id });
        }
        else socket.emit("ON_PAIRFAILED", null);
    },

    // If user skips current pair and on searching new pair
    OnSkipCurrentPair: function(socket) {
        console.log("Skip pair");
        // Define Index of current pair
        var ind = 0;
        var cur_id = "";
        // Find the pair where current user is joined, remove current pair and add it to sockets array
        pairs.forEach(element => {
            if(element.f.id == socket.id || element.s.id == socket.id){
                m_sockets.push(element.f);
                m_sockets.push(element.s);
                if (element.f.id == socket.id) {
                    cur_id = element.s.id;
                    element.s.emit("LEFT_CHAT");
                }
                else {
                    cur_id = element.f.id;
                    element.f.emit("LEFT_CHAT");
                }
                return;
            }   
            ind ++;
        });
        pairs.splice(ind, 1);
        console.log(cur_id);
        // Send Skipping pair response and search another pair
        this.OnCreateNewPair(socket, cur_id);
    },
    // Change the user's filter and find the pair
    OnChangeFilter: function(socket, data) {
        console.log("Change Filter");
        console.log(m_sockets.length);
        console.log(pairs.length);
        
        var ind = 0;
        var found = false;
        // Find me
        m_sockets.forEach(element => {
            if(element.id == socket.id){
                element.isSearching = true;
                found = true;
                return;
            }
            ind ++;
        });
        m_sockets[ind].user_data.pre_age_from = data.pre_age_from;
        m_sockets[ind].user_data.pre_age_to = data.pre_age_to;
        m_sockets[ind].user_data.pre_gender = data.pre_gender;
        // m_sockets[ind].user_data.pre_age_from = data.pre_age_from;
        // m_sockets[ind].user_data.pre_age_from = data.pre_age_from;
        if (found == false) {
            pairs.forEach(element => {
                if(element.f.id == socket.id) {
                    pairs[ind].f.user_data.pre_age_from = data.pre_age_from;
                    pairs[ind].f.user_data.pre_age_to = data.pre_age_to;
                    pairs[ind].f.user_data.pre_gender = data.pre_gender;
                    return;
                }
                if(element.s.id == socket.id){
                    pairs[ind].s.user_data.pre_age_from = data.pre_age_from;
                    pairs[ind].s.user_data.pre_age_to = data.pre_age_to;
                    pairs[ind].s.user_data.pre_gender = data.pre_gender;
                    return;
                }   
                ind ++;
            });
        }
        OnSkipCurrentPair(socket);
    },
    // If user send a new message
    OnNewMessage: function(sender, text, image, video) {  //sender stands for (sender)socket
        var snd_flag = false;
        pairs.forEach(element => {
            if(element.f.id == sender.id){
                element.s.emit("NEW_MESSAGE", {
                    sender: sender.username,
                    msg: text,
                    img: image,
                    vid: video
                });
                snd_flag = true;
                return;
            } else if(element.s.id ==  sender.id) {
                element.f.emit("NEW_MESSAGE", {
                    sender: sender.username,
                    msg: text,
                    img: image,
                    vid: video
                });
                snd_flag = true;
                return;
            }
        });
        sender.emit("MESSAGE_SENT", {flag: snd_flag});
    },
    OnEditMessage: function() {
        console.log("You Edited a Message");
    },
    OnTyping: function(sender) {
        // console.log("typing");
        pairs.forEach(element => {
            if(element.f.id == sender.id){
                element.s.emit("MESSAGE_TYPING");
                return;
            } else if(element.s.id ==  sender.id) {
                element.f.emit("MESSAGE_TYPING");
                return;
            }
        });
    },
    OnDoneTyping: function(sender) {
        // console.log("done typing");
        pairs.forEach(element => {
            if(element.f.id == sender.id){
                element.s.emit("MESSAGE_DONE_TYPING");
                return;
            } else if(element.s.id ==  sender.id) {
                element.f.emit("MESSAGE_DONE_TYPING");
                return;
            }
        });
    },
    // On Socket Connection Closed
    OnCloseConnection: function(socket) {
        console.log("Close Connection");
        console.log(m_sockets.length);
        console.log(pairs.length);
        // Find if closed guest is not yet paired and remove it from sockets list if not paired yet.
        var ind = 0;
        m_sockets.forEach(element => {
            if(element.id == socket.id)
                return;
            ind ++;
        });
        m_sockets.splice(ind, 1);
        // Find if closed guest is paired and remove that socket from pair group, and move paired guest to sockets list
        ind = 0;
        pairs.forEach(element => {
            if(element.f.id == socket.id || element.s.id == socket.id)
                return;
            ind ++;
        });

        if(pairs.length > 0) {
            if(pairs[ind].f.id == socket.id) m_sockets.push(pairs[ind].s);
            else m_sockets.push(pairs[ind].f);
            pairs.splice(ind, 1);
        }
        console.log(m_sockets.length);
        console.log(pairs.length);
    }
}