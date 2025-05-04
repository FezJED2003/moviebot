
import { auth } from "./firebase-config.js";  // Import auth from my config
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js"; // Import signIn function
import { GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";



// code adapted from firebase 2025
document.getElementById("loginButton").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("User logged in:", userCredential.user.email);
    window.location.href = "chatbot.html";  // Redirect after login
  } catch (error) {
    alert("Login failed: " + error.message);
  }
});


document.getElementById("googleLogin").addEventListener("click",async ()=> {

const provider = new GoogleAuthProvider();
try {
const result = await signInWithPopup (auth, provider);
const user = result.user;
console.log("Google sign-in was successful", user);
window.location.href = "chatbot.html";


} catch (error){
  console.error ("Google sign-in error :", error);
  alert(error.message);
}


});

//end of adapted code 