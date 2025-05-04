// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

function getMovieTitle(){

let titleElement = document.querySelector(".previewModal--player-titleTreatment-logo") ||
document.querySelector(".video-title"); 

if(titleElement){

return titleElement.textContent.trim();
    
}
    return null;

}


setInterval(() => {
    let movieTitle = getMovieTitle();
    if (movieTitle) {
        console.log("Currently Watching:", movieTitle);
        chrome.runtime.sendMessage({ action: "fetchRecommendations", title: movieTitle });
    }
}, 5000);



const chatbotContainer = document.createElement("div");
chatbotContainer.id = "movieChatbot";

document.body.appendChild(chatbotContainer);


