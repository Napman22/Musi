// SignIn.jsx
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebaseConfig"; 

function SignIn({ onSignInSuccess, onNavigateToSignUp }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("Signed in:", userCredential.user);

      if (onSignInSuccess) {
        onSignInSuccess(userCredential.user);
      }
    } catch (error) {
      console.error("Error signing in:", error);
      alert(error.message || "Sign in failed");
    }
  };

  return (
    <div>
      <h2>Sign In</h2>
      <form onSubmit={handleSignIn}>
        <input
          type="email"
          placeholder="Email..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        /><br />
        <input
          type="password"
          placeholder="Password..."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        /><br />
        <button type="submit">Sign In</button>
      </form>

      {/* The new "Sign Up" button here: */}
      <div style={{ marginTop: "1rem" }}>
        <p>Don't have an account?</p>
        <button onClick={onNavigateToSignUp}>Sign Up</button>
      </div>
    </div>
  );
}

export default SignIn;
