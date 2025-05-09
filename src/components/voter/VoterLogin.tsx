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
} from "firebase/auth";
import { auth, db } from "../../firebase/config";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
// import emailjs from "@emailjs/browser"; // Commented out as it's not used

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
  // const [otp, setOtp] = useState("");
  // const [generatedOtp, setGeneratedOtp] = useState("");
  const [step, /* setStep */] = useState<"login" | "otp">("login"); // Commented out setStep as it's not used
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    number: false,
    symbol: false,
  });
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  // const [otpExpirationTime, setOtpExpirationTime] = useState<number | null>(null); // Track OTP expiration time
  // const [isOtpExpired, setIsOtpExpired] = useState(false); // Track if OTP is expired
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate("/voter/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // useEffect(() => {
  //   if (otpExpirationTime) {
  //     const interval = setInterval(() => {
  //       const currentTime = Date.now();
  //       if (currentTime >= otpExpirationTime) {
  //         setIsOtpExpired(true); // Mark OTP as expired
  //         clearInterval(interval); // Clear the interval
  //       }
  //     }, 1000);

  //     return () => clearInterval(interval); // Cleanup on unmount
  //   }
  // }, [otpExpirationTime]);

  const validateForm = (): boolean => {
    if (!email || !password) {
      setError("Email and password are required");
      return false;
    }

    if (!isLogin) {
      if (!college) {
        setError("College is required");
        return false;
      }

      if (!email.endsWith(colleges[college])) {
        setError(`Email must end with ${colleges[college]}`);
        return false;
      }

      const passwordRegex = /^(?=.*[A-Z])(?=.*\d+)(?=.*[!@#$%^&*]+)[A-Za-z\d!@#$%^&*]{6,}$/;
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

  // const generateOtp = () => {
  //   return Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
  // };

  // const sendOtp = async () => {
  //   const otp = generateOtp();
  //   setGeneratedOtp(otp);
  //   const expirationTime = new Date(Date.now() + 2 * 60 * 1000); // Set expiration time to 2 minutes from now
  //   setOtpExpirationTime(expirationTime.getTime());
  //   setIsOtpExpired(false); // Reset OTP expiration status

  //   // Log OTP to the console for testing
  //   console.log(`Generated OTP: ${otp}`);

  //   // EmailJS configuration
  //   const serviceId = "service_oaf1646"; // Replace with your EmailJS service ID
  //   const templateId = "template_9xjtx7d"; // Replace with your EmailJS template ID
  //   const publicKey = "z1LjV6uNRGIRUr8jW"; // Replace with your EmailJS public key

  //   const templateParams = {
  //     passcode: otp, // Generated OTP
  //     time: expirationTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), // Expiration time in HH:MM format
  //     email: email, // User's email (ensure this matches the placeholder in your EmailJS template)
  //   };

  //   try {
  //     await emailjs.send(serviceId, templateId, templateParams, publicKey);
  //     console.log(`OTP sent to ${email}: ${otp}`);
  //   } catch (error) {
  //     console.error("Error sending OTP via EmailJS:", error);
  //     setError("Failed to send OTP. Please try again.");
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);

        // Generate and send OTP
        // await sendOtp();
        // setStep("otp"); // Move to OTP verification step
        // Navigate to the dashboard after successful login
        navigate("/voter");
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Send verification email
        await sendEmailVerification(userCredential.user);

        // Store user data in the database
        await setDoc(doc(db, "users", userCredential.user.uid), {
          name,
          email,
          college,
          role: "voter",
          createdAt: serverTimestamp(),
        });

        // After registration, switch to login mode
        setIsLogin(true);
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setCollege("");
        setName("");
        setResetSent(false); // Clear any previous reset state
        setError(""); // Clear any error messages
        setResetSent(true); // Trigger success message
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

  // const handleOtpVerification = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setError("");

  //   if (isOtpExpired) {
  //     setError("OTP has expired. Please request a new OTP.");
  //     return;
  //   }

  //   if (otp === generatedOtp) {
  //     // OTP verified, redirect to dashboard
  //     window.location.href = "/voter";
  //   } else {
  //     setError("Invalid OTP. Please try again.");
  //   }
  // };

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
              Registration successful. Please log in.
            </Alert>
          )}

          {/* {step === "otp" && (
            <form onSubmit={handleOtpVerification}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Enter the OTP sent to your email.
              </Typography>
              <TextField
                label="OTP"
                variant="outlined"
                type="text"
                fullWidth
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                sx={{ mb: 2 }}
                disabled={isOtpExpired} // Disable input if OTP is expired
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading || isOtpExpired} // Disable button if OTP is expired
              >
                {loading ? <CircularProgress size={24} /> : "Verify OTP"}
              </Button>
              {isOtpExpired && (
                <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                  OTP has expired. Please request a new OTP.
                </Typography>
              )}
            </form>
          )} */}

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

                <Grid item xs={12}>
                  <TextField
                    label="Password"
                    variant="outlined"
                    type="password"
                    fullWidth
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    onFocus={() => !isLogin && setShowPasswordRequirements(true)} // Show requirements on focus
                    onBlur={() => setShowPasswordRequirements(false)} // Hide requirements on blur
                    required
                  />
                  {!isLogin && showPasswordRequirements && ( // Show only during registration and when focused
                    <ul style={{ margin: "8px 0 0", paddingLeft: "20px", fontSize: "0.875rem", lineHeight: "1.2" }}>
                      <li style={{ color: passwordRequirements.length ? "green" : "red" }}>
                        Password must be at least 6 characters long
                      </li>
                      <li style={{ color: passwordRequirements.uppercase ? "green" : "red" }}>
                        Password must include at least one capital letter
                      </li>
                      <li style={{ color: passwordRequirements.number ? "green" : "red" }}>
                        Password must include at least one number
                      </li>
                      <li style={{ color: passwordRequirements.symbol ? "green" : "red" }}>
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