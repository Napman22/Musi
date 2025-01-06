const express = require("express");
const cors = require("cors");

const app = express();

const admin = require("firebase-admin");
const credentials = require("./creds.json");

admin.initializeApp({
  credential: admin.credential.cert(credentials),
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = admin.firestore();

// ----------------- CRUD Routes -----------------

// Create user
app.post("/create", async (req, res) => {
  try {
    console.log(req.body);
    const userJson = {
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      artists: req.body.artists,
      genres: req.body.genres,
      songs: req.body.songs,
    };
    const response = await db.collection("users").add(userJson);
    res.send(response);
  } catch (error) {
    res.send(error);
  }
});

// Get all users
app.get("/read/all", async (req, res) => {
  try {
    const usersRef = db.collection("users");
    const response = await usersRef.get();
    let responseArr = [];
    response.forEach((doc) => {
      responseArr.push(doc.data());
    });
    res.send(responseArr);
  } catch (error) {
    res.send(error);
  }
});

// Get single user by doc ID
app.get("/read/:id", async (req, res) => {
  try {
    const userRef = db.collection("users").doc(req.params.id);
    const response = await userRef.get();
    res.send(response.data());
  } catch (error) {
    res.send(error);
  }
});

// Update user
app.post("/update", async (req, res) => {
  try {
    const id = req.body.id;
    const userRef = db.collection("users").doc(id);

    await userRef.update({
      firstName: "hello",
    });

    const updatedDoc = await userRef.get();
    res.send(updatedDoc.data());
  } catch (error) {
    res.send(error);
  }
});

// Delete user
app.delete("/delete/:id", async (req, res) => {
  try {
    const response = await db.collection("users").doc(req.params.id).delete();
    res.send(response);
  } catch (error) {
    res.send(error);
  }
});


async function getAllUsers() {
  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Missing auth token" });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log("Decoded token:", decodedToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}


app.use(authMiddleware);

(async () => {
  const users = await getAllUsers();
  module.exports = { users };
  console.log("All users:", users);
})();

module.exports = { getAllUsers };

const { computeAllSimilarities } = require("./userMatches");

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

    res.json(matchResults);
  } catch (err) {
    console.error("Error computing matches:", err);
    res.status(500).json({ error: "Failed to compute matches" });
  }
});

app.post("/send-invite", authMiddleware, async (req, res) => {
  try {
    const senderId = req.user.uid; 
    const { receiverId, message } = req.body;

    if (!receiverId) {
      return res.status(400).json({ error: "Receiver ID is required" });
    }

    await db.collection("invites").add({
      senderId,
      receiverId,
      message: message || "Hi! I'd like to connect!",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: "pending", // You can add a default status if you want
    });

    res.status(200).json({ message: "Invite sent successfully" });
  } catch (error) {
    console.error("Error sending invite:", error);
    res.status(500).json({ error: "Failed to send invite" });
  }
});

// Fetch pending invites
app.get("/get-invites", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;

    const invitesSnapshot = await db
      .collection("invites")
      .where("receiverId", "==", userId)
      .where("status", "==", "pending")
      .get();

    const invites = invitesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(invites);
  } catch (error) {
    console.error("Error fetching invite:", error);
    res.status(500).json({ error: "Failed to fetch invites" });
  }
});

// Accept invite
app.post("/accept-invite", authMiddleware, async (req, res) => {
  try {
    const { inviteId } = req.body;
    await db.collection("invites").doc(inviteId).update({
      status: "accepted",
      acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(200).json({ message: "Invite accepted successfully!" });
  } catch (error) {
    console.error("Error accepting invite:", error);
    res.status(500).json({ error: "Failed to accept invite" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}.`);
});
