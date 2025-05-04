import { auth } from "./firebase-config.js";  // Correct import for the auth instance
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js"; // Import createUserWithEmailAndPassword
import { GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
//import { setDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";



document.addEventListener("DOMContentLoaded", () => {
  const registerButton = document.getElementById("registerButton");

  // Debug: Check if the button is found
  console.log(registerButton);

  registerButton.addEventListener("click", async () => {
    alert("Button clicked"); 

    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;
       // code adapted from firebase documentation 2025
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "Users", user.uid), {
        email: user.email,
        createdAt: new Date().toISOString()
      });

      alert("Registration successful!");
      window.location.href = "chatbot.html";
s    } catch (error) {
      console.error("Registration error:", error);
      alert(error.message);
    }
  });
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
  
// end of adapted code