import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import firebaseConfig from "./configCreds.json"; // Adjust the path

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
