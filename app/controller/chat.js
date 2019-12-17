
// Socket Array Saving All the new client sockets
var m_sockets = [];
// Socket Pair Object Array 
var pairs = [];

module.exports = {
    // When new guest joined to chatting, need to add to the guest list
    OnNewGuesJoined: function(socket) {
        // Add New Guest's socket to Sockets array
        m_sockets.push(socket);
    },

    // Guest confirm his user name
    OnConfirmName: function(socket, username) {
        m_sockets.forEach(element => {
            if(element.id == socket.id)
                element.username = username
        });
        socket.emit("UNAME_CONFIRMED", username);
    },

    // When a user searches his pair
    OnCreateNewPair: function(socket) {
        // Pull 2 sockets including requested socket, and idle socket and pair it
        var ind1 = 0, ind2=0;
        var dif_found = false, same_found = false;
        var res_sock;
        var paired = false;
        m_sockets.forEach(element => {
            if((element.id != socket.id && element.isSearching)){
                // Add new pair to pairs
                pairs.push({f: socket, s:element});
                dif_found = true;
                res_sock = element;
            } else if(element.id == socket.id){
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
        // Send Search Result to both Sides
        if(paired){
            socket.emit("ON_PAIRED", { username: res_sock.username, pair_id: res_sock.id });
            res_sock.emit("ON_PAIRED", { username: socket.username, pair_id: socket.id });
        }
        else socket.emit("ON_PAIRFAILED", null);
    },

    // If user skips current pair and on searching new pair
    OnSkipCurrentPair: function(socket) {
        // Define Index of current pair
        var ind = 0;
        // Find the pair where current user is joined, remove current pair and add it to sockets array
        pairs.forEach(element => {
            if(element.f.id == socket.id || element.s.id == socket.id){
                m_sockets.push(element.f);
                m_sockets.push(element.s);
                return;
            }   
            ind ++;
        });
        pairs.slice(ind, 1);
        // Send Skipping pair response and search another pair
        socket.emit("ON_PAIR_REMOVED", null);
        this.OnCreateNewPair(socket);
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

    // On Socket Connection Closed
    OnCloseConnection: function(socket) {
        // Find if closed guest is not yet paired and remove it from sockets list if not paired yet.
        var ind = 0;
        m_sockets.forEach(element => {
            if(element.id == socket.id)
                return;
            ind ++;
        });
        m_sockets.slice(ind, 1);

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
            pairs.slice(ind, 1);
        }
    }
}