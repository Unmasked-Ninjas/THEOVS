import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase/config";
import { CircularProgress, Box } from "@mui/material";

// Admin components
import AdminLogin from "./components/admin/AdminLogin";
import AdminRegister from "./components/admin/AdminRegister";
import AdminDashboard from "./components/admin/AdminDashboard";
import CreatePoll from "./components/admin/CreatePoll";
import EditPoll from "./components/admin/EditPoll";
import PollResults from "./components/admin/PollResults";

// Voter components
import VoterLogin from "./components/voter/VoterLogin";
import VoterDashboard from "./components/voter/VoterDashboard";
import VoteBallot from "./components/voter/VoteBallot";

// Other components
import LandingPage from "./components/LandingPage";
import NotFound from "./components/NotFound";
import AdminLayout from "./components/layout/AdminLayout";

// Protected route wrapper
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRole: string;
}> = ({ children, allowedRole }) => {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          // Check user role in Firestore
          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setHasAccess(userData.role === allowedRole);
            } else {
              setHasAccess(false);
            }
          } catch (error) {
            console.error("Error checking user role:", error);
            setHasAccess(false);
          }
        } else {
          setHasAccess(false);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    };

    checkAuth();
  }, [allowedRole]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return hasAccess ? <>{children}</> : <Navigate to="/" />;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/voter/login" element={<VoterLogin />} />
        <Route path="/admin/register" element={<AdminRegister />} />

        {/* Protected admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/create-poll"
            element={
              <ProtectedRoute allowedRole="admin">
                <CreatePoll />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/poll/:pollId/edit"
            element={
              <ProtectedRoute allowedRole="admin">
                <EditPoll />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/poll/:pollId/results"
            element={
              <ProtectedRoute allowedRole="admin">
                <PollResults />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Protected voter routes */}
        <Route
          path="/voter"
          element={
            <ProtectedRoute allowedRole="voter">
              <VoterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vote/:pollId"
          element={
            <ProtectedRoute allowedRole="voter">
              <VoteBallot />
            </ProtectedRoute>
          }
        />

        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
