import { auth, database, ref, push, set}  from './firebase-config.js';

export async function sendMessage(conversationId, sender, text) {

    const user = auth.currentUser;
// checnking if user has loggged in or not.
 if (!user){
    console.error("User not logged in");
    return;
 }

// saves conversations to real time database
const messageRef = ref(database, `conversations/${conversationId}/messages`);
const newMessageRef = push(messageRef);

await set(newMessageRef,{
    sender : sender,
    text: text,
    timestamp : Date.now(),

})
console.log("Message saved!");


}