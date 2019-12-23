
// Socket Array Saving All the new client sockets
let m_sockets = [];
// Socket Pair Object Array 
let pairs = [];

module.exports = {
    // When new guest joined to chatting, need to add to the guest list
    OnNewGuesJoined: function(socket) {
        // Add New Guest's socket to Sockets array
        console.log("New Connection");
        socket.emit("CONNECTION_ACCEPTED");
    },

    // Guest confirm his user name
    OnConfirmJoin: function(socket, user_data) {
        console.log("User data added", socket.id);
        m_sockets.push(socket);
        
        m_sockets[m_sockets.length - 1].user_data = user_data;
        
        socket.emit("USER_CONFIRMED", {id: socket.id, name: user_data.name});
        console.log("id ", m_sockets[m_sockets.length - 1].id, "name ", user_data.name);
    },

    // When a user searches his pair
    OnCreateNewPair: function(socket, cur_id) {
        // Pull 2 sockets including requested socket, and idle socket and pair it
        console.log("Create Pair");
        console.log("B sockets", m_sockets.length);
        console.log("B pairs", pairs.length);
        console.log("id ", socket.id);
        var ind1 = 0, ind2=0;
        var dif_found = false, same_found = false;
        var res_sock;
        var me;
        var paired = false;
        // Find me
        for (let element of m_sockets) {
            console.log(element.user_data.name);
            if(element.id == socket.id){
                element.isSearching = true;
                me = element;
                break;
            }
            ind2 ++;
        }

        // Find pair
        console.log("Me name: ", socket.id);
        console.log("Me name: ", me.user_data);
        if (me.user_data === undefined || me.user_data === null) {
            return;
        }
        // m_sockets.forEach(element => {
        for (let element of m_sockets) {
            console.log(element.user_data.name);
            console.log(element.id);
            console.log(me.id);
            if( element.id != me.id && element.isSearching && element.id != cur_id
                && element.user_data.age >= me.user_data.pre_age_from
                && element.user_data.age <= me.user_data.pre_age_to
                && element.user_data.gender == me.user_data.pre_gender
                && (element.user_data.country == me.user_data.pre_country
                    || me.user_data.pre_country == 'Anywhere')
                && ( element.user_data.state == me.user_data.pre_state
                    || me.user_data.pre_state == 'Anywhere')) {
                // Add new pair to pairs
                console.log("new pair ", me.id, element.id);
                console.log("new pair ", element.id);
                pairs.push({f: me, s:element});
                dif_found = true;
                res_sock = element;
            }

            if(!dif_found)
                ind1 ++;
            if(dif_found) {
                console.log("before delete ", ind1, ind2);

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
                break;
            }
        }
        console.log("A sockets", m_sockets.length);
        console.log("A pairs", pairs.length);
        // Send Search Result to both Sides
        if(paired){
            socket.emit("ON_PAIRED", { username: res_sock.user_data.name, pair_id: res_sock.id });
            res_sock.emit("ON_PAIRED", { username: me.user_data.name, pair_id: socket.id });
        }
        else socket.emit("ON_PAIRFAILED", null);
    },

    // If user skips current pair and on searching new pair
    OnNextPair: function(socket, data, bSkupCur) {
        console.log("Skip pair");
        console.log("B sockets", m_sockets.length);
        console.log("B pairs", pairs.length);
        // Define Index of current pair
        var ind = 0;
        var cur_id = "";
        var cur_pair;
        
        if (data.paired) {
            // Find the pair where current user is joined, remove current pair and add it to sockets array
            // pairs.forEach(element => {
            for (let element of pairs) {
                if(element.f.id == socket.id || element.s.id == socket.id){
                    m_sockets.push(element.f);
                    m_sockets.push(element.s);
                    if (element.f.id == socket.id) {
                        // cur_id = element.s.id;
                        // element.s.emit("LEFT_CHAT");
                        cur_pair = element.s;
                    }
                    else {
                        // cur_id = element.f.id;
                        // element.f.emit("LEFT_CHAT");
                        cur_pair = element.f;
                    }
                    break;
                }   
                ind ++;
            }
            pairs.splice(ind, 1);
            cur_pair.emit("LEFT_CHAT");
            cur_id = cur_pair.id;
        }
        
        console.log("A sockets", m_sockets.length);
        console.log("A pairs", pairs.length);
        // Send Skipping pair response and search another pair
        if (bSkupCur == true)
            this.OnCreateNewPair(socket, cur_id);
        else
            this.OnCreateNewPair(socket, "");
    },
    // Change the user's filter and find the pair
    OnChangeFilter: function(socket, data) {
        console.log("Change Filter");
        console.log("B sockets", m_sockets.length);
        console.log("B pairs", pairs.length);
        
        var ind = 0;
        var found = false;
        // Find me
        // m_sockets.forEach(element => {
        for (let element of m_sockets) {
            if(element.id == socket.id){
                element.isSearching = true;
                found = true;
                break;
            }
            ind ++;
        }
        console.log(ind);
        if (found == true) {
            m_sockets[ind].user_data.pre_age_from = data.pre_age_from;
            m_sockets[ind].user_data.pre_age_to = data.pre_age_to;
            m_sockets[ind].user_data.pre_gender = data.pre_gender;
            m_sockets[ind].user_data.pre_country = data.pre_country;
            m_sockets[ind].user_data.pre_state = data.pre_state;
        }
        
        if (found == false) {
            // pairs.forEach(element => {
            for (let element of pairs) {
                if(element.f.id == socket.id) {
                    pairs[ind].f.user_data.pre_age_from = data.pre_age_from;
                    pairs[ind].f.user_data.pre_age_to = data.pre_age_to;
                    pairs[ind].f.user_data.pre_gender = data.pre_gender;
                    pairs[ind].f.user_data.pre_country = data.pre_country;
                    pairs[ind].f.user_data.pre_state = data.pre_state;
                    break;
                }
                if(element.s.id == socket.id){
                    pairs[ind].s.user_data.pre_age_from = data.pre_age_from;
                    pairs[ind].s.user_data.pre_age_to = data.pre_age_to;
                    pairs[ind].s.user_data.pre_gender = data.pre_gender;
                    pairs[ind].s.user_data.pre_country = data.pre_country;
                    pairs[ind].s.user_data.pre_state = data.pre_state;
                    break;
                }   
                ind ++;
            }
        }
        this.OnNextPair(socket, data, false);
    },
    // If user send a new message
    OnNewMessage: function(sender, text, image) {  //sender stands for (sender)socket
        console.log("New Message", image == null);
        var snd_flag = false;
        // pairs.forEach(element => {
        for(let element of pairs) {
            if(element.f.id == sender.id){
                element.s.emit("NEW_MESSAGE", {
                    msg: text,
                    img: image,
                });
                
                snd_flag = true;
                break;
            } else if(element.s.id ==  sender.id) {
                element.f.emit("NEW_MESSAGE", {
                    msg: text,
                    img: image,
                });
                snd_flag = true;
                break;
            }
        }
        sender.emit("MESSAGE_SENT", {flag: snd_flag});
    },
    OnTyping: function(sender) {
        console.log("typing");
        // pairs.forEach(element => {
        for(let element of pairs) {
            if(element.f.id == sender.id){
                element.s.emit("MESSAGE_TYPING");
                break;
            } else if(element.s.id ==  sender.id) {
                element.f.emit("MESSAGE_TYPING");
                break;
            }
        }
    },
    OnDoneTyping: function(sender) {
        // console.log("done typing");
        // pairs.forEach(element => {
        for(let element of pairs) {
            if(element.f.id == sender.id){
                element.s.emit("MESSAGE_DONE_TYPING");
                break;
            } else if(element.s.id ==  sender.id) {
                element.f.emit("MESSAGE_DONE_TYPING");
                break;
            }
        }
    },
    // On Socket Connection Closed
    OnCloseConnection: function(socket) {
        console.log("Close Connection");
        console.log("B sockets", m_sockets.length);
        console.log("B pairs", pairs.length);
        var found = false;
        // Find if closed guest is not yet paired and remove it from sockets list if not paired yet.
        var ind = 0;
        // m_sockets.forEach(element => {
        for(let element of m_sockets) {
            if(element.id == socket.id) {
                found = true;
                break;
            }
            ind ++;
        };
        console.log("found? ", found, "ind ", ind);
        if (found)
            m_sockets.splice(ind, 1);
        // Find if closed guest is paired and remove that socket from pair group, and move paired guest to sockets list
        ind = 0;
        if (found == false) {
            for (let element of pairs) {
                if(element.f.id == socket.id || element.s.id == socket.id) {
                    found = true;
                    break;
                }
                ind ++;
            }
            console.log("Close pair idx ", ind);
            if(found) {
                if(pairs[ind].f.id == socket.id) {
                    m_sockets.push(pairs[ind].s);
                    pairs[ind].s.emit("LEFT_CHAT");
                }
                else {
                    m_sockets.push(pairs[ind].f);
                    pairs[ind].f.emit("LEFT_CHAT");
                }
                pairs.splice(ind, 1);
            }
        }
        console.log("A sockets", m_sockets.length);
        console.log("A pairs", pairs.length);
    }
}