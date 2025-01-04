import React, { useState } from "react";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { auth } from "../lib/firebaseConfig"; // your config file

function OnboardingForm({ onComplete }) {
  const [genres, setGenres] = useState(["", "", ""]);
  const [artists, setArtists] = useState(["", "", ""]);
  const [songs, setSongs] = useState(["", "", ""]);

  const handleGenreChange = (index, value) => {
    const updated = [...genres];
    updated[index] = value;
    setGenres(updated);
  };

  const handleArtistChange = (index, value) => {
    const updated = [...artists];
    updated[index] = value;
    setArtists(updated);
  };

  const handleSongChange = (index, value) => {
    const updated = [...songs];
    updated[index] = value;
    setSongs(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be signed in!");
        return;
      }

      const db = getFirestore();
      const data = {
        email: user.email,
        genres,
        artists,
        songs,
      };

      await setDoc(doc(db, "users", user.uid), data);

      alert("Preferences saved!");

      // Callback to notify the parent we are done
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error("Error saving preferences:", err);
      alert("Failed to save preferences");
    }
  };

  return (
    <div>
      <h2>Tell Us Your Favorites</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <h3>Your Top 3 Genres</h3>
          {genres.map((g, idx) => (
            <input
              key={`genre-${idx}`}
              type="text"
              placeholder={`Genre #${idx + 1}`}
              value={g}
              onChange={(e) => handleGenreChange(idx, e.target.value)}
            />
          ))}
        </div>

        <div>
          <h3>Your Top 3 Artists</h3>
          {artists.map((a, idx) => (
            <input
              key={`artist-${idx}`}
              type="text"
              placeholder={`Artist #${idx + 1}`}
              value={a}
              onChange={(e) => handleArtistChange(idx, e.target.value)}
            />
          ))}
        </div>

        <div>
          <h3>Your Top 3 Songs</h3>
          {songs.map((s, idx) => (
            <input
              key={`song-${idx}`}
              type="text"
              placeholder={`Song #${idx + 1}`}
              value={s}
              onChange={(e) => handleSongChange(idx, e.target.value)}
            />
          ))}
        </div>

        <button type="submit" style={{ marginTop: "1rem" }}>
          Submit
        </button>
      </form>
    </div>
  );
}

export default OnboardingForm;
