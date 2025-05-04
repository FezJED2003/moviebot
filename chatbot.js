import { auth, db, database, ref, push, set } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    arrayUnion
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const genreMapping = {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Sci-Fi",
    10770: "TV Movie",
    53: "Thriller",
    10752: "War",
    37: "Western"
};


//  Function to save messages to Realtime Database
async function sendMessage(conversationId, sender, text) {
    const user = auth.currentUser;
    if (!user) {
        console.error("User not logged in");
        return;
    }

    const messageRef = ref(database, `conversations/${conversationId}/messages`);
    const newMessageRef = push(messageRef);

    await set(newMessageRef, {
        sender: sender,
        text: text,
        timestamp: Date.now()
    });

    console.log("Message saved!");
}

// Load TensorFlow if needed
const tfScript = document.createElement("script");
tfScript.src = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.13.0/dist/tf.min.js";
document.head.appendChild(tfScript);

document.addEventListener("DOMContentLoaded", function () {
    const chatbox = document.getElementById("chatbox");

    onAuthStateChanged(auth, (user) => {
        if (user) {
            const msg = `Hi ${user.displayName || user.email}! How can I help you today? Ask me for movie recommendations.`;
            displayBotMessage(msg);
        } else {
            displayBotMessage("Hi! I am MovieBot! Please log in to get personalized movie recommendations.");
        }
    });

    document.getElementById("userInputBtn").addEventListener("click", () => {
        const userInput = document.getElementById("textInput").value.trim();
        if (userInput) {
            displayUserMessage(userInput);
            handleChatbotResponse(userInput);
            document.getElementById("textInput").value = "";
        }
    });

    const intents = {
        recommendation: ["recommend", "suggest", "action", "comedy", "movie", "thriller", "drama"],
        watchlist: ["watchlist", "saved", "favorites", "saved movies"],
        save: ["save", "add to watchlist", "remember", "store"],
        greeting: ["hi", "hello", "hey"],
        goodbye: ["bye", "goodbye", "see you"],
        details: ["what is", "tell me about", "details", "plot of", "description of"],
        recommendCheck: ["do you recommend", "should i watch", "is this good", "is it good", "is", "worth watching", "would you recommend"]
    };


function cleanUpTitle (input) {

    const blacklistWords = ["do you recommend", "should i watch", "is this good", "is it good", 
        "is", "it", "this", "good", "worth watching", "would you recommend",
        "please", "movie", "film"];



let cleaned = input.toLowerCase();


for (const word of blacklistWords){
    const pattern = new RegExp("\\b" + word + "\\b", "gi");
    cleaned = cleaned.replace(pattern, "");
}

return cleaned.replace()

}

    

    function detectIntent(input) {
        const lowered = input.toLowerCase();
        for (const [intent, keywords] of Object.entries(intents)) {
            for (const word of keywords) {
                if (lowered.includes(word)) return intent;
            }
        }
        return "unknown";
    }

    async function handleChatbotResponse(input) {
        const user = auth.currentUser;
        const conversationId = user ? user.uid : "anonymous";

        const yearMatch = input.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) {
            const year = yearMatch[0];
            const topMovies = await fetchTopMoviesByYear(year);
            if (topMovies.length > 0) {
                displayBotMessage(`Here are the top 10 movies from ${year}:`);
                for (let movie of topMovies) {
                    const msg = `${movie.title} (${movie.release_date}) - Rating: ${movie.rating}`;
                    displayBotMessage(msg);
                }
            } else {
                displayBotMessage(`I couldn't find top movies for ${year}.`);
            }
            return;
        }

        const intent = detectIntent(input);

        if (intent === "save") {
            const lastMovie = input.replace(/save|add to watchlist|remember|store/gi, "").trim();
            if (lastMovie) {
                await saveToWatchlist(lastMovie);
            } else {
                displayBotMessage("What movie would you like to save?");
            }
            return;
        }

        if (intent === "details") {
            const cleanTitle = input.replace(/what is|tell me about|details|plot of|description of/gi, "").trim();
            if (cleanTitle) {
                const info = await fetchTmdbDetails(cleanTitle);
                if (info) {
                    const msg = `Title: ${info.title}\nOverview: ${info.overview}\nRelease Date: ${info.release_date}\nRating: ${info.rating}`;
                    displayBotMessage(msg);
                } else {
                    displayBotMessage("Sorry, I couldn't find that movie or show.");
                }
            } else {
                displayBotMessage("Please specify which movie or TV show you want details about.");
            }
            return;
        }

        if (intent === "watchlist") {
            const watchlist = await getWatchlist();
            if (watchlist.length > 0) {
                const msg = `Here's your watchlist: ${watchlist.join(", ")}`;
                displayBotMessage(msg);
            } else {
                displayBotMessage("Your watchlist is empty!");
            }
            return;
        }
        if (intent === "recommendCheck") {
            const cleaned = input.toLowerCase()
                .replace(/(do you recommend|should i watch|is this good|is it good|is|worth watching|would you recommend|\?|please)/gi, "")
                .trim();
        
            if (cleaned.length > 0) {
                const info = await fetchTmdbDetails(cleaned);
                if (info && info.rating !== "Unrated") {
                    const rating = parseFloat(info.rating);
                    if (rating >= 7) {
                        displayBotMessage(`Yes! "${info.title}" has a rating of ${rating}, so it's definitely worth watching.`);
                    } else if (rating >= 5) {
                        displayBotMessage(`"${info.title}" has a rating of ${rating}. It might be okay if you're interested, but it's not highly rated.`);
                    } else {
                        displayBotMessage(`I'd probably skip "${info.title}" — it only has a rating of ${rating}.`);
                    }
                } else {
                    displayBotMessage(`Hmm, I couldn't find ratings for "${cleaned}".`);
                }
            } else {
                displayBotMessage("Please tell me which movie you're asking about.");
            }
            return;
        }
        

        if (intent === "recommendation" || intent === "unknown") {
            const recommendations = await fetchRecommendations(input);
            if (recommendations.length > 0 && recommendations[0].title !== "No recommendations found.") {
                const titles = recommendations.map(rec => rec.title || "Unknown").join(", ");
                displayBotMessage("Sure! Here are some movie recommendations: " + titles);
            } else {
                displayBotMessage("Sorry, I couldn't find any recommendations for that. Let me try fetching from TMDb instead.");
                const tmdbRecommendations = await fetchTmdbRecommendations(input);
                if (tmdbRecommendations.length > 0) {
                    tmdbRecommendations.forEach(rec => {
                        const msg = `Title: ${rec.title}\nOverview: ${rec.overview}\nRelease Date: ${rec.release_date}\nRating: ${rec.rating}`;
                        displayBotMessage(msg);
                    });
                } else {
                    displayBotMessage("Sorry, no recommendations were found.");
                }
            }
            return;
        }

        if (intent === "greeting") {
            displayBotMessage("Hey there! Ready for some movie magic?");
        } else if (intent === "goodbye") {
            displayBotMessage("Bye for now! Come back when you're ready for more movie picks.");
        } else {
            displayBotMessage("I'm not sure what you mean. Try asking for movie recommendations or your watchlist.");
        }
    }

    function displayUserMessage(msg) {
        const bubble = document.createElement("div");
        bubble.className = "speech-bubble-user";
        bubble.textContent = msg;
        chatbox.appendChild(bubble);
        chatbox.scrollTop = chatbox.scrollHeight;

        const user = auth.currentUser;
        if (user) sendMessage(user.uid, "user", msg);
    }

    function displayBotMessage(msg) {
        const bubble = document.createElement("div");
        bubble.className = "speech-bubble-bot";
        bubble.textContent = msg;
        chatbox.appendChild(bubble);
        chatbox.scrollTop = chatbox.scrollHeight;

        const user = auth.currentUser;
        if (user) sendMessage(user.uid, "bot", msg);
    }

    async function saveToWatchlist(movieTitle) {
        const user = auth.currentUser;
        if (!user) {
            displayBotMessage("Please log in to save movies to your watchlist.");
            return;
        }

        try {
            const docRef = doc(db, "watchlists", user.uid);
            await setDoc(docRef, {
                movies: arrayUnion(movieTitle)
            }, { merge: true });

            displayBotMessage(`"${movieTitle}" has been added to your watchlist.`);
        } catch (error) {
            console.error("Error saving to watchlist:", error);
            displayBotMessage("Failed to save movie to watchlist.");
        }
    }

    async function getWatchlist() {
        const user = auth.currentUser;
        if (!user) return [];

        try {
            const docRef = doc(db, "watchlists", user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data().movies || [];
            } else {
                return [];
            }
        } catch (error) {
            console.error("Error fetching watchlist:", error);
            return [];
        }
    }

    async function fetchRecommendations(movieTitle) {
        try {
            const response = await fetch("http://127.0.0.1:8080/recommend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ movie_title: movieTitle })
            });

            if (response.ok) {
                const data = await response.json();
                return Array.isArray(data) ? data : [];
            } else {
                console.error("Recommendation fetch failed:", response.status);
                return [];
            }
        } catch (error) {
            console.error("Error connecting to backend:", error);
            return [];
        }
    }

    async function fetchTmdbRecommendations(title) {
        const TMDB_API_KEY = "3cb6a2c6a362a17415a5eeca2df7f971";
        const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(title)}&api_key=${TMDB_API_KEY}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                const movieId = data.results[0].id;
                const recUrl = `https://api.themoviedb.org/3/movie/${movieId}/recommendations?api_key=${TMDB_API_KEY}`;
                const recResponse = await fetch(recUrl);
                const recData = await recResponse.json();

                return recData.results.map(movie => ({
                    title: movie.title,
                    overview: movie.overview || "No overview available.",
                    release_date: movie.release_date || "Release date unavailable.",
                    rating: movie.vote_average || "No rating available."
                }));
            } else {
                return [];
            }
        } catch (error) {
            console.error("TMDb fetch error:", error);
            return [];
        }
    }

    async function fetchTmdbDetails(title) {
        const TMDB_API_KEY = "3cb6a2c6a362a17415a5eeca2df7f971";
        const url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(title)}&api_key=${TMDB_API_KEY}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                const result = data.results[0];
                return {
                    title: result.title || result.name || "Unknown Title",
                    overview: result.overview || "No description available.",
                    release_date: result.release_date || result.first_air_date || "Date unknown",
                    rating: result.vote_average || "Unrated"
                };
            } else {
                return null;
            }
        } catch (error) {
            console.error("TMDb details fetch error:", error);
            return null;
        }
    }

    async function fetchTopMoviesByYear(year) {
        const TMDB_API_KEY = "3cb6a2c6a362a17415a5eeca2df7f971";
        const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&sort_by=vote_average.desc&primary_release_year=${year}&vote_count.gte=100`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            return data.results.slice(0, 10).map(movie => ({
                title: movie.title,
                overview: movie.overview || "No overview available.",
                release_date: movie.release_date || "Unknown",
                rating: movie.vote_average || "N/A"
            }));
        } catch (error) {
            console.error("Error fetching top movies by year:", error);
            return [];
        }
    }
});

document.getElementById("textInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        document.getElementById("userInputBtn").click();
    }
});
