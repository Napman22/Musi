const { getAllUsers } = require("./lib/firebase"); 

//we could remove this and just used Rank Based Algo for genres
function jaccardSimilarity(genresA, genresB) {
  const setA = new Set(genresA);
  const setB = new Set(genresB);

  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionCount++;
    }
  }
  const unionCount = setA.size + setB.size - intersectionCount;
  if (unionCount === 0) return 0;

  return intersectionCount / unionCount;
}

function customSimilarity(user1, user2) {
  // 1) Genre overlap
  const genreSimilarity = jaccardSimilarity(user1.genres, user2.genres);

  // 2) Artist overlap (rank-based)
  let artistScore = 0;
  user1.artists.forEach((artist, indexA) => {
    const indexB = user2.artists.indexOf(artist);
    if (indexB !== -1) {
      const rankA = indexA + 1;
      const rankB = indexB + 1;
      artistScore += (1 / rankA) + (1 / rankB);
    }
  });

  // 3) Song overlap (rank-based)
  let songScore = 0;
  user1.songs.forEach((song, indexA) => {
    const indexB = user2.songs.indexOf(song);
    if (indexB !== -1) {
      const rankA = indexA + 1;
      const rankB = indexB + 1;
      songScore += (1 / rankA) + (1 / rankB);
    }
  });

  // 4) Weighted sum
  const wG = 0.4; // weight for genres
  const wA = 0.3; // weight for artists
  const wS = 0.3; // weight for songs

  return wG * genreSimilarity + wA * artistScore + wS * songScore;
}

function computeAllSimilarities(userMap) {
  const userIds = Object.keys(userMap);
  const similarities = {};

  for (let i = 0; i < userIds.length; i++) {
    const userI = userIds[i];
    if (!similarities[userI]) similarities[userI] = {};

    for (let j = i + 1; j < userIds.length; j++) {
      const userJ = userIds[j];
      if (!similarities[userJ]) similarities[userJ] = {};

      const user1 = userMap[userI];
      const user2 = userMap[userJ];
      const score = customSimilarity(user1, user2);

      similarities[userI][userJ] = score;
      similarities[userJ][userI] = score;
    }
    // self-similarity
    similarities[userI][userI] = 1.0;
  }
  return similarities;
}

function logUsersAndMatches(userMap, similarities, topN = 3) {
  const userIds = Object.keys(userMap);

  userIds.forEach((userId) => {
    const profile = userMap[userId];
    console.log(`\n=== ${userId} ===`);
    console.log(`Genres:  [${profile.genres.join(", ")}]`);
    console.log(`Artists: [${profile.artists.join(", ")}]`);
    console.log(`Songs:   [${profile.songs.join(", ")}]`);

    const matches = Object.entries(similarities[userId])
      .filter(([otherUser]) => otherUser !== userId)
      .sort((a, b) => b[1] - a[1]);

    const topMatches = matches.slice(0, topN);

    console.log(`Top ${topN} matches:`);
    topMatches.forEach(([otherUser, score]) => {
      console.log(`  - ${otherUser} (score=${score.toFixed(3)})`);
      const matchProfile = userMap[otherUser];
      console.log(`    Genres:  [${matchProfile.genres.join(", ")}]`);
      console.log(`    Artists: [${matchProfile.artists.join(", ")}]`);
      console.log(`    Songs:   [${matchProfile.songs.join(", ")}]`);
    });
  });
}


async function main() {
    try {
      const userDocs = await getAllUsers();
  
      // build a userMap that the similarity code expects
      const userMap = {};
      userDocs.forEach(({ id, genres, artists, songs }) => {
        userMap[id] = { genres, artists, songs };
      });
  
      //Compute similarities & log matches
      const allSimilarities = computeAllSimilarities(userMap);
      console.log("\n=== Similarities ===");
      console.log(JSON.stringify(allSimilarities, null, 2));
  
      logUsersAndMatches(userMap, allSimilarities, 3);
    } catch (err) {
      console.error("Error in main():", err);
      //Optionally exit or handle the error further
      process.exit(1);
    }
  }
  
  main().catch((err) => {
    console.error("Unhandled error in main():", err);
    process.exit(1);
  });
