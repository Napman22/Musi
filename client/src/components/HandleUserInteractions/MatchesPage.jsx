import React, { useState, useEffect } from "react";
import { getIdToken } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";

function MatchesPage({ currentUser }) {
  const [matches, setMatches] = useState([]); // Array of matches
  const [currentIndex, setCurrentIndex] = useState(0); // Current match being displayed

  useEffect(() => {
    async function fetchMatches() {
      if (!currentUser) return;

      try {
        const token = await getIdToken(currentUser);
        const response = await fetch("http://localhost:8080/matches", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();

        // Transform data to an array of matches for the logged-in user
        if (typeof data === "object") {
          const formattedMatches = data[currentUser.uid] || [];
          setMatches(formattedMatches);
        } else {
          console.error("Unexpected response format:", data);
        }
      } catch (err) {
        console.error("Error fetching matches:", err);
      }
    }

    fetchMatches();
  }, [currentUser]);

  const sendInvite = async (matchedUserId) => {
    try {
      const token = await getIdToken(currentUser);
      const response = await fetch("http://localhost:8080/send-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // IMPORTANT: use 'receiverId' here
        body: JSON.stringify({ receiverId: matchedUserId }),
      });

      if (response.ok) {
        alert("Invite sent!");
      } else {
        alert("Failed to send invite.");
      }
    } catch (error) {
      console.error("Error sending invite:", error);
      alert("Failed to send invite.");
    }
  };

  const handleNext = () => {
    if (currentIndex < matches.length - 1) {
      setCurrentIndex((prevIndex) => prevIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prevIndex) => prevIndex - 1);
    }
  };

  const currentMatch = matches[currentIndex];

  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      <h1>Your Matches</h1>
      {matches.length === 0 ? (
        <p>No matches found.</p>
      ) : (
        <>
          <div
            style={{
              position: "relative",
              height: "300px",
              overflow: "hidden",
              marginBottom: "2rem",
            }}
          >
            <AnimatePresence>
              {currentMatch && (
                <motion.div
                  key={currentMatch.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    backgroundColor: "#f9f9f9",
                    padding: "1rem",
                    borderRadius: "10px",
                    position: "absolute",
                    width: "100%",
                    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <h2>Matched User: {currentMatch.id}</h2>
                  <p>
                    <strong>Score:</strong>{" "}
                    {currentMatch.score !== undefined
                      ? currentMatch.score.toFixed(3)
                      : "N/A"}
                  </p>
                  <p>
                    <strong>Genres:</strong>{" "}
                    {currentMatch.genres?.length > 0
                      ? currentMatch.genres.join(", ")
                      : "None provided"}
                  </p>
                  <p>
                    <strong>Artists:</strong>{" "}
                    {currentMatch.artists?.length > 0
                      ? currentMatch.artists.join(", ")
                      : "None provided"}
                  </p>
                  <p>
                    <strong>Songs:</strong>{" "}
                    {currentMatch.songs?.length > 0
                      ? currentMatch.songs.join(", ")
                      : "None provided"}
                  </p>
                  <button
                    onClick={() => sendInvite(currentMatch.id)}
                    style={{
                      marginTop: "1rem",
                      padding: "0.5rem 1rem",
                      backgroundColor: "#007bff",
                      color: "#fff",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    Send Invite
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div>
            <button onClick={handlePrevious} disabled={currentIndex === 0}>
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === matches.length - 1}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default MatchesPage;
