//manage the result of voter dashboard
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
  status: string; // Add status to Poll interface
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
      const now = new Date();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const startDate =
          typeof data.startDate === "string"
            ? new Date(data.startDate)
            : data.startDate?.toDate?.() || new Date();
        const endDate =
          typeof data.endDate === "string"
            ? new Date(data.endDate)
            : data.endDate?.toDate?.() || new Date();

        // Determine poll status
        let status = "";
        if (now < startDate) {
          status = "Not Started";
        } else if (now > endDate) {
          const timeDifference = Math.abs(now.getTime() - endDate.getTime());
          const daysDifference = timeDifference / (1000 * 60 * 60 * 24);
          if (daysDifference <= 2) {
            status = "Ended";
          } else {
            return; // Skip polls that ended more than 2 days ago
          }
        } else {
          status = "Active";
        }

        // Include polls regardless of status but filter by college
        if (data.collegeName === voterCollegeName) {
          pollsData.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            startDate,
            endDate,
            isActive: status === "Active",
            status, // Add status to poll object
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
