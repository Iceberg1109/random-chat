
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
    OnCreateNewPair: function(socket) {
        // Pull 2 sockets including requested socket, and idle socket and pair it
        var ind1 = 0, ind2=0;
        var dif_found = false, same_found = false;
        var res_sock;
        var paired = false;
        m_sockets.forEach(element => {
            if((element.id != socket.id)){
                // Add new pair to pairs
                pairs.push({socket, element});
                dif_found = true;
                res_sock = element;
            } else same_found = true;

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
                break;
            }
        });
        // Send Search Result to Requested Side
        if(paired)
            socket.emit("ON_PAIRED", { username: res_sock.username });
        else socket.emit("ON_PAIRFAILED", null);
    },
    OnSkipCurrentPair: function(socket) {

    },
    OnNewMessage: function(sender_id, receiver_id, text, image, video) {
        console.log("You received a new message", text);
    },
    OnEditMessage: function() {
        console.log("You Edited a Message");
    }
}