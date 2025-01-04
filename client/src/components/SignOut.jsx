import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "/Users/tuckeranderson-sanford/Documents/testingReact/Musi/client/src/lib/firebaseConfig"; // your config file

function SignOut({ onSignOutSuccess }) {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log("User signed out successfully.");
      // If a parent component wants to do something
      // after signing out (like navigate), call a callback:
      if (onSignOutSuccess) {
        onSignOutSuccess();
      }
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to sign out");
    }
  };

  return (
    <button onClick={handleSignOut}>
      Sign Out
    </button>
  );
}

export default SignOut;
