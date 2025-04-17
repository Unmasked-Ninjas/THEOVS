import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Button,
} from "@mui/material";
import { signOut } from "firebase/auth";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import PollList from "./PollList";
import PollResults from "../admin/PollResults";
import VotingHistory from "./VotingHistory";

interface Poll {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

const VoterDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    setLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      // Retrieve the voter's college name
      const userDoc = await getDoc(doc(db, "users", userId));
      const voterCollegeName = userDoc.exists() ? userDoc.data().college : null;

      if (!voterCollegeName) {
        setError("Failed to retrieve voter college information");
        setLoading(false);
        return;
      }

      const pollsRef = collection(db, "polls");
      const querySnapshot = await getDocs(pollsRef);

      const pollsData: Poll[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.collegeName === voterCollegeName) {
          pollsData.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            // Handle both string dates and Firestore timestamps
            startDate:
              typeof data.startDate === "string"
                ? new Date(data.startDate)
                : data.startDate?.toDate?.() || new Date(),
            endDate:
              typeof data.endDate === "string"
                ? new Date(data.endDate)
                : data.endDate?.toDate?.() || new Date(),
            isActive: data.status === "active", // Using the status field from your data
          });
        }
      });

      setPolls(pollsData);
    } catch (err) {
      console.error("Error fetching polls:", err);
      setError(`Failed to fetch polls: ${err || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Redirect to login happens via Router auth listener
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          mt: 2,
        }}
      >
        <Typography variant="h4" component="h1">
          Voter Dashboard
        </Typography>
        <Button variant="outlined" color="error" onClick={handleSignOut}>
          Sign Out
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Available Polls" />
          <Tab label="My Voting History" />
          <Tab label="Results" />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography color="error">{error}</Typography>
          <Button variant="contained" onClick={fetchPolls} sx={{ mt: 2 }}>
            Retry
          </Button>
        </Box>
      ) : (
        <Box sx={{ p: 1 }}>
          {activeTab === 0 && <PollList polls={polls} />}
          {activeTab === 1 && <VotingHistory />}
          {activeTab === 2 && <PollResults />}
        </Box>
      )}
    </Container>
  );
};

export default VoterDashboard;
