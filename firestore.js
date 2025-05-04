import { getAuth } from "firebase/auth";
import { getFirestore,setDoc, getDoc, doc }  from "firebase/firestore";

const db = getFirestore()
const auth = getAuth();
//functions to detect the Users preferences 
async function getUserPreferences() {
    const user = auth.currentUser;
    if(!user) return {};

    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc (docRef);

    if (docSnap.exists()) {
        return docSnap.data().preferences || {};

        
    }
    
    return {};
}

function genreIdsToNames(genreIds, genreMap){
return genreIds.map(id => genreMap[id]);

}

// gets the score of the Movies
function scoreMovie(movie, preferences, genreMap){
let score = 0;

const movieGenres = genreIdsToNames(movie.genreIds || [], genreMap);
const cast = movie.cast_names || [];
const crew = movie.crew_manes || [];


if (preferences.genres){
    score += movieGenres.filter(g => preferences.genres.includes(g)).length;

}
if (preferences.actors) {
    score += cast.filter(actor => preferences.actors.includes(actor)).length;
  }

  if (preferences.directors) {
    score += crew.filter(director => preferences.directors.includes(director)).length;
  }

  if (preferences.languages && preferences.languages.includes(movie.original_language)) {
    score += 1;
  }

  return score;
}

function getRecommendations(movies, preferences, genreMap) {
    const results = [];
  
    for (const movie of movies) {
      if (
        preferences.watch_history &&
        preferences.watch_history.includes(movie.title)
      ) {
        continue;
      }
  
      const score = scoreMovie(movie, preferences, genreMap);
      if (score > 0) {
        movie.score = score;
        results.push(movie);
      }
    }
  
    return results.sort((a, b) => {
      if (b.score === a.score) return b.vote_average - a.vote_average;
      return b.score - a.score;
    });
  }
  

  async function recommendMovies(movies, genreMap) {
    const preferences = await getUserPreferences();
    const personalised = getRecommendations(movies, preferences, genreMap);
  
    return personalised.map(movie => ({
      title: movie.title,
      overview: movie.overview,
      score: movie.score,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      language: movie.original_language
    }));
  }
  // export logic to save on the chatbot. logic 
  export async function recommendMovies1(movies, genreMap, userPreferences) {
    if (!movies || !Array.isArray(movies)) return [];
  
    return movies.filter(movie => {
      const hasPreferredGenre = movie.genre_ids?.some(id => userPreferences.preferredGenres.includes(id));
      const isPreferredLanguage = movie.original_language === userPreferences.language;
      return hasPreferredGenre && isPreferredLanguage;
    });
  }
