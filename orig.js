const GENRES = [
    "Rock",
    "Pop",
    "Blues",
    "Jazz",
    "Classical",
    "Hip-Hop",
    "R&B",
    "Electronic",
    "Country",
    "Metal",
  ];
  const ARTISTS = [
    "Taylor Swift",
    "Radiohead",
    "B.B. King",
    "Miles Davis",
    "Michael Jackson",
    "Beethoven",
    "Eminem",
    "Daft Punk",
    "Johnny Cash",
    "Metallica",
    "Beyoncé",
    "Adele",
    "Justin Bieber",
    "Elvis Presley",
    "The Beatles",
  ];
  const SONGS = [
    "Creep",
    "The Thrill Is Gone",
    "So What",
    "Billie Jean",
    "Für Elise",
    "Lose Yourself",
    "Get Lucky",
    "Ring of Fire",
    "Enter Sandman",
    "All Shook Up",
    "Shape of You",
    "Someone Like You",
    "Hey Jude",
    "Stairway to Heaven",
    "Hound Dog",
    "Smooth Criminal",
    "Baby",
    "Thriller",
    "Back in Black",
    "Wonderwall",
  ];
  
  // Helper function to get a random subset (with random order)
  function getRandomSubset(array, subsetSize = 3) {
    // Make a shallow copy
    const arrCopy = [...array];
    // Shuffle in-place: Fisher-Yates (Durstenfeld) shuffle
    for (let i = arrCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arrCopy[i], arrCopy[j]] = [arrCopy[j], arrCopy[i]];
    }
    return arrCopy.slice(0, subsetSize);
  }
  
  const userMap = {};

  //generates 100 users for the userMap
  for (let i = 1; i <= 100; i++) {
    const userId = `user${i}`;
    userMap[userId] = {
      genres: getRandomSubset(GENRES, 3),   
      artists: getRandomSubset(ARTISTS, 3), 
      songs: getRandomSubset(SONGS, 3),     
    };
  }
  


  console.log(JSON.stringify(userMap, null, 2));
  
  

  
  
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
    // 1) Genre overlap (using Jaccard)
    const genreSimilarity = jaccardSimilarity(
      new Set(user1.genres),
      new Set(user2.genres)
    );
  
    // 2) Artist overlap (rank-based)
    //    We'll do something like sum(1/rankA + 1/rankB) for each matching artist.
    let artistScore = 0;
    user1.artists.forEach((artist, indexA) => {
      const indexB = user2.artists.indexOf(artist);
      if (indexB !== -1) {
        // The smaller the rank, the bigger the score. 
        // rank = index+1 => #1 => rank=1 => bigger contribution
        const rankA = indexA + 1;
        const rankB = indexB + 1;
        artistScore += (1 / rankA) + (1 / rankB);
      }
    });
  
    // 3) Song overlap (same logic as artist overlap)
    let songScore = 0;
    user1.songs.forEach((song, indexA) => {
      const indexB = user2.songs.indexOf(song);
      if (indexB !== -1) {
        const rankA = indexA + 1;
        const rankB = indexB + 1;
        songScore += (1 / rankA) + (1 / rankB);
      }
    });
  
    // 4) Weighted sum of all parts
    const wG = 0.4; // weight for genres
    const wA = 0.3; // weight for artists
    const wS = 0.3; // weight for songs
  
    // You can normalize or clamp these scores as needed.
    return wG * genreSimilarity + wA * artistScore + wS * songScore;
  }
  
  

  function computeAllSimilarities(userMap) {
    const userIds = Object.keys(userMap);
    const similarities = {}; 
    // Option 1: store results in an object, e.g. similarities["userA"]["userB"] = 0.8
    // Option 2: store results in a 2D matrix, etc.
  
    for (let i = 0; i < userIds.length; i++) {
      const userI = userIds[i];
      // Initialize sub-object if not present
      if (!similarities[userI]) similarities[userI] = {};
  
      for (let j = i + 1; j < userIds.length; j++) {
        const userJ = userIds[j];
        if (!similarities[userJ]) similarities[userJ] = {};
  
        const user1 = userMap[userI];
        const user2 = userMap[userJ];
  
        const score = customSimilarity(user1, user2);
  
        // Set symmetric values:
        similarities[userI][userJ] = score;
        similarities[userJ][userI] = score;
      }
  
      // self-similarity if you like, or set to null
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
  
      // Create an array of [otherUser, similarityScore], excluding self
      const matches = Object.entries(similarities[userId])
        .filter(([otherUser]) => otherUser !== userId)
        .sort((a, b) => b[1] - a[1]); // sort by descending similarity
  
      // Take the top N matches
      const topMatches = matches.slice(0, topN);
  
      console.log(`Top ${topN} matches:`);
      topMatches.forEach(([otherUser, score]) => {
        console.log(`  - ${otherUser} (score=${score.toFixed(3)})`);
        // Print the other user's genres/artists/songs as well
        const matchProfile = userMap[otherUser];
        console.log(`    Genres:  [${matchProfile.genres.join(", ")}]`);
        console.log(`    Artists: [${matchProfile.artists.join(", ")}]`);
        console.log(`    Songs:   [${matchProfile.songs.join(", ")}]`);
      });
    });
  }
  

  
  

  const allSimilarities = computeAllSimilarities(userMap);

  console.log(JSON.stringify(allSimilarities, null, 2));

  logUsersAndMatches(userMap, allSimilarities, 3);


