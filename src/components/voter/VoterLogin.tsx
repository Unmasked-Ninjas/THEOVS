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
} from "@mui/material";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "../../firebase/config";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const VoterLogin: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate("/voter/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        // Login user
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/voter");
      } else {
        // Register new user
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Create user profile in Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          name,
          email,
          role: "voter",
          createdAt: serverTimestamp(),
        });

        navigate("/voter");
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setError("Invalid email or password");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Email is already registered");
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError("");
    } catch (err: any) {
      console.error("Password reset error:", err);
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email");
      } else {
        setError("Failed to send password reset email");
      }
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
              ? "Sign in to access polls and cast your vote"
              : "Create an account to participate in polls"}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {resetSent && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Password reset link has been sent to your email
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {!isLogin && (
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
              )}

              <Grid item xs={12}>
                <TextField
                  label="Email Address"
                  variant="outlined"
                  type="email"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Password"
                  variant="outlined"
                  type="password"
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
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
