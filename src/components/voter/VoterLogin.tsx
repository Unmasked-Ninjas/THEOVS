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
} from "firebase/auth";
import { auth, db } from "../../firebase/config";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const colleges: Record<string, string> = {
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [college, setCollege] = useState<keyof typeof colleges | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
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
    if (!email || !password) {
      setError("Email and password are required");
      return false;
    }

    if (!isLogin && !college) {
      setError("College is required");
      return false;
    }

    if (!isLogin && !email.endsWith(colleges[college])) {
      setError(`Email must end with ${colleges[college]}`);
      return false;
    }

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/voter");
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        await setDoc(doc(db, "users", userCredential.user.uid), {
          name,
          email,
          college,
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
                </>
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
                  helperText={college && `Email must end with ${colleges[college]}`}
                  sx={{ mb: college ? 2 : 0 }} // Add space dynamically when helper text is shown
                />
              </Grid>

              {!isLogin && (
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
              )}

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
