import pandas as pd
import csv
import ast
import nltk
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Union
from openai import OpenAI

client = OpenAI(api_key="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")  

# Extract keywords from user input using OpenAI

def extract_keywords_from_openai(user_input: str):
    prompt = f"Extract key themes, genres, and keywords from the following user request for a movie: '{user_input}'. Return a list of lowercase keywords."
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful movie recommendation assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=100,
            temperature=0.7
        )
        content = response.choices[0].message.content
        keywords = [kw.strip().lower() for kw in content.replace("[", "").replace("]", "").replace('"', '').split(",")]
        return keywords
    except Exception as e:
        print(f"OpenAI keyword extraction failed: {e}")
        return []

csv.field_size_limit(10_000_000)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

movies_df = pd.read_csv("imdb_movies.csv", dtype={'id': str})
credits_df = pd.read_csv("movie_data.csv", engine="python", dtype={'id': str})

movies_df.columns = movies_df.columns.str.strip().str.lower()
credits_df.columns = credits_df.columns.str.strip().str.lower()

if 'id' in movies_df.columns and 'id' in credits_df.columns:
    movies_df = movies_df[movies_df['id'].str.isnumeric()]
    credits_df = credits_df[credits_df['id'].str.isnumeric()]
    movies_df['id'] = movies_df['id'].astype(int)
    credits_df['id'] = credits_df['id'].astype(int)
    movies_df = movies_df.merge(credits_df, on='id', how='left')
else:
    print("Missing 'id' columns")

title_column = "title" if "title" in movies_df.columns else movies_df.columns[0]

TMDB_API_KEY = "3cb6a2c6a362a17415a5eeca2df7f971"

def fetch_genres(title: str) -> List[str]:
    url = f"https://api.themoviedb.org/3/search/movie?query={title}&api_key={TMDB_API_KEY}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        if data["results"]:
            movie_id = data["results"][0]["id"]
            details_url = f"https://api.themoviedb.org/3/movie/{movie_id}?api_key={TMDB_API_KEY}"
            details_response = requests.get(details_url)
            if details_response.status_code == 200:
                details = details_response.json()
                return [g["name"] for g in details.get("genres", [])]
    return ["Unknown"]

if 'genres' not in movies_df.columns:
    movies_df['genres'] = movies_df[title_column].apply(fetch_genres)

def extract_names(data: Union[str, list]) -> List[str]:
    try:
        people = ast.literal_eval(data) if isinstance(data, str) else data
        return [person.get("name", "Unknown") for person in people[:5]]
    except:
        return ["Unknown"]

if 'cast' in movies_df.columns:
    movies_df["cast_names"] = movies_df["cast"].apply(extract_names)

if 'crew' in movies_df.columns:
    movies_df["crew_names"] = movies_df["crew"].apply(extract_names)

def fetch_keywords(title: str) -> List[str]:
    url = f"https://api.themoviedb.org/3/search/movie?query={title}&api_key={TMDB_API_KEY}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        if data["results"]:
            movie_id = data["results"][0]["id"]
            keywords_url = f"https://api.themoviedb.org/3/movie/{movie_id}/keywords?api_key={TMDB_API_KEY}"
            keywords_response = requests.get(keywords_url)
            if keywords_response.status_code == 200:
                keywords_data = keywords_response.json()
                return [kw["name"] for kw in keywords_data.get("keywords", [])]
    return ["Unknown"]

if 'keywords' not in movies_df.columns:
    movies_df["keywords"] = movies_df[title_column].apply(fetch_keywords)

nltk.download("punkt")
nltk.download("stopwords")
nltk.download("wordnet")
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
stop_words = set(stopwords.words("english"))
lemmatizer = WordNetLemmatizer()

class MovieRequest(BaseModel):
    movie_title: str  

def fetch_tmdb_recommendations(title: str):
    try:
        url = f"https://api.themoviedb.org/3/search/movie?query={title}&api_key={TMDB_API_KEY}"
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            if data["results"]:
                movie_id = data["results"][0]["id"]
                rec_url = f"https://api.themoviedb.org/3/movie/{movie_id}/recommendations?api_key={TMDB_API_KEY}"
                rec_response = requests.get(rec_url)
                if rec_response.status_code == 200:
                    rec_data = rec_response.json()
                    return [{
                        "title": movie.get("title", "Unknown"),
                        "overview": movie.get("overview", "Unknown"),
                        "release_date": movie.get("release_date", "Unknown"),
                        "rating": movie.get("vote_average", "Unknown")
                    } for movie in rec_data["results"][:5]]
    except Exception as e:
        print(f"TMDb fallback error: {e}")
    return [{"title": "No recommendations found.", "overview": "", "release_date": "", "rating": ""}]

def movie_matches(row, genre_keywords):
    genre_str = str(row.get("genres", "")).lower()
    keyword_str = str(row.get("keywords", "")).lower()
    overview_str = str(row.get("overview", "")).lower()

    score = 0
    for kw in genre_keywords:
        if kw in genre_str:
            score += 3
        if kw in keyword_str:
            score += 2
        if kw in overview_str:
            score += 1
    return score

@app.post("/recommend")
def smart_recommend(movie: MovieRequest):
    try:
        user_input = movie.movie_title.strip()
        if not user_input:
            return {"error": "Movie title is empty."}

        keywords = extract_keywords_from_openai(user_input)
        if not keywords:
            return fetch_tmdb_recommendations(user_input)

        movies_df["match_score"] = movies_df.apply(lambda row: movie_matches(row, keywords), axis=1)
        filtered = movies_df[movies_df["match_score"] > 0].sort_values(by="match_score", ascending=False)
        filtered = filtered.drop_duplicates(subset=title_column)

        results = [{
            "title": row.get(title_column, "Unknown"),
            "overview": row.get("overview", "Unknown"),
            "release_date": row.get("release_date", "Unknown"),
            "rating": row.get("vote_average", "Unknown")
        } for _, row in filtered.head(5).iterrows()]

        if results:
            return results
        else:
            return fetch_tmdb_recommendations(user_input)
    except Exception as e:
        print(f"Smart recommend error: {e}")
        return {"error": str(e)}
