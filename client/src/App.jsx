import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebaseConfig";
import SignUp from "./components/SignUp";
import SignIn from "./components/SignIn";
import SignOut from "./components/SignOut";
import OnboardingForm from "./components/OnboardingForm";
import MatchesPage from "./components/MatchesPage";


function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [step, setStep] = useState("signin");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setStep("signin");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignUpSuccess = () => {
    setStep("signin");
  };

  const handleNavigateToSignUp = () => {
    setStep("signup");
  };

  const handleSignInSuccess = () => {
    // maybe go to onboarding if new user, or matches if existing
    setStep("onboarding");
  };

  const handleOnboardingComplete = () => {
    setStep("matches");
  };

  // When user signs out:
  const handleSignOutSuccess = () => {
    setStep("signin");
  };

  if (step === "signup") {
    return <SignUp 
    onSignUpSuccess={handleSignUpSuccess} />;
  }

  if (step === "signin") {
    return <SignIn 
      onSignInSuccess={handleSignInSuccess} 
      onNavigateToSignUp={handleNavigateToSignUp}
    />;
  }

  if (step === "onboarding" && currentUser) {
    return <OnboardingForm onComplete={handleOnboardingComplete} />;
  }

  if (step === "matches" && currentUser) {
    return (
      <div>
        <MatchesPage currentUser={currentUser} />
        <SignOut onSignOutSuccess={handleSignOutSuccess} />
      </div>
    );
  }

  return (
    <div>
      <h2>Welcome</h2>
      <button onClick={() => setStep("signup")}>Sign Up</button>
      <button onClick={() => setStep("signin")}>Sign In</button>
    </div>
  );
}

export default App;
