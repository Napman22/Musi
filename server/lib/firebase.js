const express = require("express");
const cors = require("cors");

const app = express();

const admin = require('firebase-admin')
const credentials = require('./creds.json')



admin.initializeApp({
  credential: admin.credential.cert(credentials)
});

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({extended: true}));

const db = admin.firestore();



app.post('/create', async (req,res) => {
  try{
    console.log(req.body);
    const id = req.body.email;
    const userJson = {
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      artists: req.body.artists,
      genres: req.body.genres,
      songs: req.songs.genres
    };
    const response = await db.collection("users").add(userJson);
    res.send(response);
  } catch(error){
    res.send(error);
  }
});

app.get('/read/all', async (req, res) => {
  try {
    const usersRef = db.collection("users");
    const response = await usersRef.get();
    let responseArr = [];
    response.forEach(doc => {
      responseArr.push(doc.data());
    });
    res.send(responseArr);
  } catch(error){
    res.send(error);
  }
});

app.get('/read/:id', async (req, res) => {
  try {
    const userRef = db.collection("users").doc(req.params.id);
    const response = await userRef.get();
    res.send(response.data());
  } catch(error){
    res.send(error);
  }
});

app.post('/update', async(req,res) => {
  try {
    const id = req.body.id;
    const newFirstName = "hello";
    const userRef = await db.collection("users").doc(id)
    .update({
      firstName: newFirstName
    })
    const response = await userRef.get();
    res.send(response);
  } catch(error){
    res.send(error);
  }
});

app.delete('/delete/:id', async(req,res) => {
  try{
    const response = await db.collection("users").doc(req.params.id).delete();
    res.send(response);
  }catch(error){
    res.send(error);
  }
});


async function getAllUsers() {
  try {
    const snapshot = await db.collection("users").get();

    // Transform each document into { id, ...data }
    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    // You can return an empty array, null, or rethrow the error
    return [];
  }
}


async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ""; 
    // Expect something like "Bearer <token>"
    const token = authHeader.split(" ")[1]; 
    if (!token) {
      return res.status(401).json({ error: "Missing auth token" });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    // decodedToken contains { uid, email, etc. }
    req.user = decodedToken; // attach to request
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
}

(async () => {
  const users = await getAllUsers();
  module.exports = { users };
  console.log("All users:", users);
})();

module.exports = { getAllUsers };

const {
  computeAllSimilarities,
  // optionally jaccardSimilarity, etc. if needed
} = require("./userMatches");

// ...
// All your existing routes (create, read, update, etc.)

app.get("/matches", async (req, res) => {
  try {
    const userDocs = await getAllUsers();

    const userMap = {};
    userDocs.forEach(({ id, genres, artists, songs }) => {
      userMap[id] = { genres, artists, songs };
    });

    const allSimilarities = computeAllSimilarities(userMap);

    const matchResults = {};

    Object.keys(userMap).forEach((userId) => {
      const sortedMatches = Object.entries(allSimilarities[userId])
        .filter(([otherId]) => otherId !== userId)
        .sort((a, b) => b[1] - a[1]) // descending by similarity
        .slice(0, 3) // top 3 matches
        .map(([matchedUserId, score]) => ({
          id: matchedUserId,
          score: score || 0,
          genres: userMap[matchedUserId]?.genres || [],
          artists: userMap[matchedUserId]?.artists || [],
          songs: userMap[matchedUserId]?.songs || [],
        }));

      matchResults[userId] = sortedMatches;
    });

    // Send the match results as JSON
    res.json(matchResults);
  } catch (err) {
    console.error("Error computing matches:", err);
    res.status(500).json({ error: "Failed to compute matches" });
  }
});



const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}.`);
})


