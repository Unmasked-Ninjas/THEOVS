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
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
} from "firebase/firestore"; // Import Firestore methods
import { useNavigate } from "react-router-dom";
import emailjs from "@emailjs/browser"; // Uncommented as it's now used

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [college, setCollege] = useState<keyof typeof colleges | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpExpirationTime, setOtpExpirationTime] = useState<number | null>(
    null
  ); // Track OTP expiration time
  const [isOtpExpired, setIsOtpExpired] = useState(false); // Track if OTP is expired
  const [step, setStep] = useState<"login" | "otp">("login"); // Enable step state
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    number: false,
    symbol: false,
  });
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);
  const [username, setUsername] = useState(""); // Add username state for login
  const [showForgotPassword, setShowForgotPassword] = useState(false); // Add state to toggle forgot password view
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate("/voter/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (otpExpirationTime) {
      const interval = setInterval(() => {
        const currentTime = Date.now();
        if (currentTime >= otpExpirationTime) {
          setIsOtpExpired(true); // Mark OTP as expired
          clearInterval(interval); // Clear the interval
        }
      }, 1000);

      return () => clearInterval(interval); // Cleanup on unmount
    }
  }, [otpExpirationTime]);

  const validateForm = (): boolean => {
    if (isLogin && (!username || !password)) {
      // Validate username instead of email for login
      setError("Username and password are required");
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

  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
  };

  const sendOtp = async (email: string, otp: string) => {
    const expirationTime = new Date(Date.now() + 2 * 60 * 1000); // Set expiration time to 2 minutes from now
    setOtpExpirationTime(expirationTime.getTime());
    setIsOtpExpired(false); // Reset OTP expiration status

    // EmailJS configuration
    const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID || "";
    const templateId = process.env.REACT_APP_OTP_TEMPLATE_ID || "";
    const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || "";

    const templateParams = {
      passcode: otp, // Generated OTP
      time: expirationTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }), // Expiration time in HH:MM format
      email: email, // User's email
    };

    try {
      await emailjs.send(serviceId, templateId, templateParams, publicKey); // Uncomment this line to send the email
      console.log(`OTP sent to ${email}: ${otp}`);
    } catch (error) {
      console.error("Error sending OTP via EmailJS:", error);
      setError("Failed to send OTP. Please try again.");
    }
  };

  const generateUniqueUsername = async (name: string): Promise<string> => {
    const usersCollection = collection(db, "users");
    let username: string = ""; // Initialize username to an empty string
    let isUnique = false;

    while (!isUnique) {
      const randomDigits = Math.floor(1000 + Math.random() * 9000).toString(); // Generate 4 random digits
      username = `${name.replace(/\s+/g, "").toLowerCase()}${randomDigits}`; // Combine name and digits
      const querySnapshot = await getDocs(usersCollection);
      isUnique = !querySnapshot.docs.some(
        (doc) => doc.data().username === username
      ); // Check uniqueness
    }

    return username;
  };

  const sendUsernameEmail = async (
    email: string,
    college_name: string,
    name: string,
    username: string // Pass the generated username as a parameter
  ) => {
    try {
      const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID || "";
      const templateId = process.env.REACT_APP_USERNAME_TEMPLATE_ID || "";
      const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || "";

      const templateParams = {
        email: email,
        name: name,
        college_name: college_name,
        username: username, // Use the passed username
      };

      await emailjs.send(serviceId, templateId, templateParams, publicKey);
      console.log(`Username email sent to ${email}`);
    } catch (error) {
      console.error("Error sending username email:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isLogin) {
        // Fetch the user document by username
        const querySnapshot = await getDocs(collection(db, "users"));
        const userDoc = querySnapshot.docs.find(
          (doc) => doc.data().username === username
        );

        if (!userDoc) {
          setError("Invalid username or password");
          setLoading(false);
          return;
        }

        const userEmail = userDoc.data().email; // Retrieve email associated with the username
        await signInWithEmailAndPassword(auth, userEmail, password);

        const user = auth.currentUser;
        if (user && !user.emailVerified) {
          setError("Please verify your email before logging in.");
          await auth.signOut();
          setLoading(false);
          return;
        }

        // Generate OTP and send it to the user's email
        const otp = generateOtp();
        setGeneratedOtp(otp);
        await sendOtp(userEmail, otp);
        setStep("otp"); // Make sure this line is executed

        // Redirect to OTP verification step
        setStep("otp");
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Send verification email
        await sendEmailVerification(userCredential.user);
        setError(
          "Verification email sent. Please verify your email to complete registration."
        );
        setLoading(false);

        // Wait for email verification
        const interval = setInterval(async () => {
          await userCredential.user.reload();
          if (userCredential.user.emailVerified) {
            clearInterval(interval);

            // Generate a unique username
            const generatedUsername = await generateUniqueUsername(name);

            // Store user data in the database
            await setDoc(doc(db, "users", userCredential.user.uid), {
              name,
              email,
              college,
              username: generatedUsername, // Save the generated username
              role: "voter",
              createdAt: serverTimestamp(),
            });

            // Send username email
            await sendUsernameEmail(email, college, name, generatedUsername); // Pass the generated username

            // Redirect to login page with success message
            setError("");
            setIsLogin(true);
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setCollege("");
            setName("");
            setResetSent(false);
            navigate("/voter/login", {
              state: {
                successMessage:
                  "Registration successful. Use your username and password to log in.",
              },
            });
          }
        }, 3000); // Check every 3 seconds
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setError("Invalid username or password");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Email is already registered");
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isOtpExpired) {
      setError("OTP has expired. Please request a new OTP.");
      return;
    }

    if (otp === generatedOtp) {
      // OTP verified, redirect to dashboard
      navigate("/voter");
    } else {
      setError("Invalid OTP. Please try again.");
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError(""); // Clear any previous error
      console.log(`Password reset email sent to ${email}`); // Debugging log
    } catch (err: any) {
      console.error("Password reset error:", err);
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address");
      } else {
        setError("Failed to send password reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  console.log("Current step:", step); // Add this near the beginning of your render function

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

          {resetSent && isLogin && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Password reset link sent to your email.
            </Alert>
          )}

          {resetSent && !isLogin && (
            <Alert
              severity="success"
              icon={<span style={{ color: "green" }}>✔</span>}
              sx={{ mb: 3 }}
            >
              Registration successful. Please verify your email before logging
              in.
            </Alert>
          )}

          {step === "otp" && (
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
          )}

          {step === "login" && (
            <>
              {showForgotPassword ? (
                <form onSubmit={handleForgotPasswordSubmit}>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    Enter your email address to receive a password reset link.
                  </Typography>
                  <TextField
                    label="Email Address"
                    variant="outlined"
                    type="email"
                    fullWidth
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    sx={{ mb: 2 }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={loading}
                  >
                    {loading ? (
                      <CircularProgress size={24} />
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                  <Button
                    color="secondary"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={() => {
                      setShowForgotPassword(false);
                      setError("");
                      setResetSent(false);
                    }}
                  >
                    Back to Login
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={2}>
                    {isLogin && (
                      <Grid item xs={12}>
                        <TextField
                          label="Username" // Change label to Username
                          variant="outlined"
                          fullWidth
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                        />
                      </Grid>
                    )}
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
                        label="Password"
                        variant="outlined"
                        type="password"
                        fullWidth
                        value={password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        onFocus={() =>
                          !isLogin && setShowPasswordRequirements(true)
                        } // Show requirements on focus
                        onBlur={() => setShowPasswordRequirements(false)} // Hide requirements on blur
                        required
                      />
                      {!isLogin &&
                        showPasswordRequirements && ( // Show only during registration and when focused
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
                                color: passwordRequirements.length
                                  ? "green"
                                  : "red",
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
                                color: passwordRequirements.number
                                  ? "green"
                                  : "red",
                              }}
                            >
                              Password must include at least one number
                            </li>
                            <li
                              style={{
                                color: passwordRequirements.symbol
                                  ? "green"
                                  : "red",
                              }}
                            >
                              Password must include at least one symbol
                              (!@#$%^&*)
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
                    onClick={() => {
                      setShowForgotPassword(true);
                      setError("");
                    }}
                    disabled={loading}
                  >
                    Forgot password?
                  </Button>
                </Box>
              )}
            </>
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
