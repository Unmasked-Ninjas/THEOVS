import React, { useState } from "react";
import {
  Box,
  Typography,
  Container,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  Grid,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../../firebase/config";
import { doc, setDoc } from "firebase/firestore";

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

const AdminRegister: React.FC = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [college, setCollege] = useState<keyof typeof colleges | "">("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setError("Name is required");
      return false;
    }

    if (!email.trim()) {
      setError("Email is required");
      return false;
    }

    if (!college) {
      setError("College is required");
      return false;
    }

    const emailDomain = colleges[college];
    if (!email.endsWith(emailDomain)) {
      setError(`Email must end with ${emailDomain}`);
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    try {
      setLoading(true);

      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Update user profile with name
      await updateProfile(user, {
        displayName: name,
      });

      // Store additional user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        email,
        college,
        role: "admin",
        createdAt: new Date().toISOString(),
      });

      navigate("/admin/dashboard");
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box my={8} display="flex" flexDirection="column" alignItems="center">
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Registration
        </Typography>

        <Card sx={{ width: "100%", mt: 3 }}>
          <CardContent>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    label="Full Name"
                    fullWidth
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    helperText={college && `Email must end with ${colleges[college]}`}
                    sx={{ mb: college ? 2 : 0 }} // Add space dynamically when helper text is shown
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
                    label="Password"
                    type="password"
                    fullWidth
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Confirm Password"
                    type="password"
                    fullWidth
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    disabled={loading}
                  >
                    {loading ? "Registering..." : "Register"}
                  </Button>
                </Grid>
              </Grid>
            </form>

            <Box mt={3} textAlign="center">
              <Link href="/admin/login" variant="body2">
                Already have an account? Login
              </Link>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default AdminRegister;
