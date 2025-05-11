import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "../../firebase/config";
import {
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
  getDocs,
  query,
  collection,
  where,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
// Use emailjs to send the generated username to user's email
import emailjs from "@emailjs/browser";

const colleges: Record<string, string> = {
  "Gmail college kathmandu": "@gmail.com",
  "Herald College Kathmandu": "@heraldcollege.edu.np",
  "Islington College": "@islingtoncollege.edu.np",
  "Biratnagar International College": "@bicnepal.edu.np",
  "Informatics College Pokhara": "@icp.edu.np",
  "Fishtail Mountain College": "@fishtailmountain.edu.np",
  "Itahari International College": "@icc.edu.np",
  "Apex College": "@apexcollege.edu.np",
  "International School of Tourism and Hotel Management (IST)":
    "@istcollege.edu.np",
  "CG Institute of Management": "@cgim.edu.np",
};

const VoterLogin: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [college, setCollege] = useState<keyof typeof colleges | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [step, setStep] = useState<"login" | "otp">("login");
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    number: false,
    symbol: false,
  });
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate("/voter/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const validateForm = (): boolean => {
    if (isLogin) {
      if (!username || !password) {
        setError("Username and password are required");
        return false;
      }
    } else {
      if (!email || !password || !name || !college) {
        setError("All fields are required");
        return false;
      }

      if (!email.endsWith(colleges[college])) {
        setError(`Email must end with ${colleges[college]}`);
        return false;
      }

      const passwordRegex =
        /^(?=.*[A-Z])(?=.*\d+)(?=.*[!@#$%^&*]+)[A-Za-z\d!@#$%^&*]{6,}$/;
      if (!passwordRegex.test(password)) {
        setError(
          "Password must be at least 6 characters long, include at least one capital letter, one number, and one symbol"
        );
        return false;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return false;
      }
    }

    return true;
  };

  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      symbol: /[!@#$%^&*]/.test(password),
    };
    setPasswordRequirements(requirements);
    return Object.values(requirements).every((req) => req);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    validatePassword(value);
  };

  // Generate a unique username based on name and random digits
  const generateUsername = (fullName: string): string => {
    const nameParts = fullName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const randomDigits = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    return `${nameParts.substring(0, 12)}${randomDigits}`;
  };

  // Check if username already exists in the database
  const isUsernameAvailable = async (username: string): Promise<boolean> => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  };

  // Generate a unique username that doesn't exist in the database
  const generateUniqueUsername = async (fullName: string): Promise<string> => {
    let username = generateUsername(fullName);
    let isAvailable = await isUsernameAvailable(username);

    // If the username already exists, keep trying until we find an available one
    while (!isAvailable) {
      username = generateUsername(fullName);
      isAvailable = await isUsernameAvailable(username);
    }

    return username;
  };

  // Send username to user's email
  const sendUsernameEmail = async (
    userEmail: string,
    userUsername: string,
    userName: string
  ) => {
    // EmailJS configuration
    const serviceId = "service_oaf1646"; // Replace with your EmailJS service ID
    const templateId = "template_9xjtx7d"; // Replace with your EmailJS template ID
    const publicKey = "z1LjV6uNRGIRUr8jW"; // Replace with your EmailJS public key

    const templateParams = {
      to_name: userName,
      username: userUsername,
      email: userEmail,
    };

    try {
      await emailjs.send(serviceId, templateId, templateParams, publicKey);
      console.log(`Username sent to ${userEmail}: ${userUsername}`);
    } catch (error) {
      console.error("Error sending username via EmailJS:", error);
      setError("Failed to send username. Please contact support.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isLogin) {
        // Login with username
        // First, query Firestore to find the user document with this username
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", username));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          throw new Error("user-not-found");
        }

        // Get the email associated with this username
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const userEmail = userData.email;

        // Use the email to sign in
        await signInWithEmailAndPassword(auth, userEmail, password);
        navigate("/voter");
      } else {
        // Registration process
        // 1. Create the user account with email/password
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // 2. Generate a unique username
        const uniqueUsername = await generateUniqueUsername(name);

        // 3. Update user profile with the username
        await updateProfile(userCredential.user, {
          displayName: uniqueUsername,
        });

        // 4. Send verification email
        await sendEmailVerification(userCredential.user);

        // 5. Store user data in the database
        await setDoc(doc(db, "users", userCredential.user.uid), {
          name,
          email,
          username: uniqueUsername,
          college,
          role: "voter",
          createdAt: serverTimestamp(),
        });

        // 6. Send username to the user's email
        await sendUsernameEmail(email, uniqueUsername, name);

        // 7. Show success message and reset the form
        setSuccessMessage(
          `Registration successful! Your username has been sent to ${email}. Please check your inbox.`
        );
        setIsLogin(true);
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setCollege("");
        setName("");
        setResetSent(false);
        setError("");
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
      if (
        err.message === "user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setError("Invalid username or password");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Email is already registered");
      } else if (err.code === "auth/user-not-found") {
        setError("No account found with this username");
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!username) {
      setError("Please enter your username");
      return;
    }

    setLoading(true);
    try {
      // Find the email associated with this username
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("No account found with this username");
        return;
      }

      // Get the email from the user document
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      const userEmail = userData.email;

      // Send password reset email
      await sendPasswordResetEmail(auth, userEmail);
      setResetSent(true);
      setSuccessMessage(
        `Password reset link sent to the email associated with username ${username}`
      );
      setError("");
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError("Failed to send password reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            {isLogin ? "Voter Login" : "Voter Registration"}
          </Typography>

          <Typography
            variant="body1"
            align="center"
            color="textSecondary"
            sx={{ mb: 3 }}
          >
            {isLogin
              ? "Sign in with your username to access polls and cast your vote"
              : "Create an account to participate in polls"}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {successMessage && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {successMessage}
            </Alert>
          )}

          {step === "login" && (
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                {!isLogin && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        label="Full Name"
                        variant="outlined"
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required={!isLogin}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel
                          sx={{
                            backgroundColor: "white",
                            px: 0.5,
                          }}
                        >
                          Choose Your College
                        </InputLabel>
                        <Select
                          value={college}
                          onChange={(e) => setCollege(e.target.value)}
                        >
                          {Object.keys(colleges).map((collegeName) => (
                            <MenuItem key={collegeName} value={collegeName}>
                              {collegeName}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        label="Email Address"
                        variant="outlined"
                        type="email"
                        fullWidth
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required={!isLogin}
                        helperText={
                          college
                            ? `Email must end with ${colleges[college]}`
                            : ""
                        }
                      />
                    </Grid>
                  </>
                )}

                {isLogin ? (
                  <Grid item xs={12}>
                    <TextField
                      label="Username"
                      variant="outlined"
                      fullWidth
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </Grid>
                ) : null}

                <Grid item xs={12}>
                  <TextField
                    label="Password"
                    variant="outlined"
                    type="password"
                    fullWidth
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    onFocus={() =>
                      !isLogin && setShowPasswordRequirements(true)
                    }
                    onBlur={() => setShowPasswordRequirements(false)}
                    required
                  />
                  {!isLogin && showPasswordRequirements && (
                    <ul
                      style={{
                        margin: "8px 0 0",
                        paddingLeft: "20px",
                        fontSize: "0.875rem",
                        lineHeight: "1.2",
                      }}
                    >
                      <li
                        style={{
                          color: passwordRequirements.length ? "green" : "red",
                        }}
                      >
                        Password must be at least 6 characters long
                      </li>
                      <li
                        style={{
                          color: passwordRequirements.uppercase
                            ? "green"
                            : "red",
                        }}
                      >
                        Password must include at least one capital letter
                      </li>
                      <li
                        style={{
                          color: passwordRequirements.number ? "green" : "red",
                        }}
                      >
                        Password must include at least one number
                      </li>
                      <li
                        style={{
                          color: passwordRequirements.symbol ? "green" : "red",
                        }}
                      >
                        Password must include at least one symbol (!@#$%^&*)
                      </li>
                    </ul>
                  )}
                </Grid>

                {!isLogin && (
                  <Grid item xs={12}>
                    <TextField
                      label="Confirm Password"
                      variant="outlined"
                      type="password"
                      fullWidth
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required={!isLogin}
                    />
                  </Grid>
                )}
              </Grid>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ mt: 3, mb: 2 }}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : isLogin ? (
                  "Sign In"
                ) : (
                  "Register"
                )}
              </Button>
            </form>
          )}

          {isLogin && (
            <Box sx={{ textAlign: "center", mt: 1, mb: 2 }}>
              <Button
                color="primary"
                onClick={handleForgotPassword}
                disabled={loading}
              >
                Forgot password?
              </Button>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ textAlign: "center" }}>
            <Button onClick={() => setIsLogin(!isLogin)} color="primary">
              {isLogin
                ? "Don't have an account? Register"
                : "Already have an account? Sign In"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default VoterLogin;
