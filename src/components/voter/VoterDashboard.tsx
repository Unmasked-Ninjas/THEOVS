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
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  SelectChangeEvent,
} from "@mui/material";
import { signOut } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import PollList from "./PollList";
import VoterPollResults from "../voter/VoterPollResults";
import VotingHistory from "./VotingHistory";
import {
  Refresh as RefreshIcon,
  ExitToApp as ExitToAppIcon,
  Dashboard as DashboardIcon,
  Poll as PollIcon,
  History as HistoryIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";
import { useSearchParams } from "react-router-dom";

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
  const [selectedPollId, setSelectedPollId] = useState<string>("");
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  // fetch polls on mount
  useEffect(() => {
    fetchPolls();
    const pollIdFromUrl = searchParams.get("pollId");
    if (pollIdFromUrl) setSelectedPollId(pollIdFromUrl);
  }, []);

  const fetchPolls = async () => {
    setLoading(true);
    try {
      const qs = await getDocs(collection(db, "polls"));
      const data: Poll[] = qs.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          title: d.title,
          description: d.description,
          startDate:
            typeof d.startDate === "string"
              ? new Date(d.startDate)
              : d.startDate?.toDate?.() || new Date(),
          endDate:
            typeof d.endDate === "string"
              ? new Date(d.endDate)
              : d.endDate?.toDate?.() || new Date(),
          isActive: d.status === "active",
        };
      });
      setPolls(data);

      // default selection
      if (data.length && !selectedPollId) {
        setSelectedPollId(data[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setError(`Failed to fetch polls: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();

  // Available = active OR upcoming OR ended ≤ 1 day ago
  const availablePolls = polls.filter((p) => {
    const endedPlusOne = new Date(p.endDate.getTime() + 86400000);
    return p.isActive || p.startDate > now || endedPlusOne >= now;
  });

  // Results = fully ended polls (you can keep or remove the 24-hour grace period here)
  const endedPolls = polls.filter((p) => !p.isActive);

  const handleTabChange = (_: React.SyntheticEvent, v: number) => {
    setActiveTab(v);
    if (v === 2 && selectedPollId) {
      setSearchParams({ pollId: selectedPollId });
    } else {
      setSearchParams({});
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePollChange = (e: SelectChangeEvent<string>) => {
    const id = e.target.value;
    setSelectedPollId(id);
    if (activeTab === 2) setSearchParams({ pollId: id });
  };

  const tabIcons = [
    <PollIcon key="p" />,
    <HistoryIcon key="h" />,
    <AssessmentIcon key="r" />,
  ];

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          my: 3,
          borderRadius: 2,
          background: `linear-gradient(to right, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
          color: "white",
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center">
            <DashboardIcon sx={{ fontSize: 32, mr: 2 }} />
            <Typography variant="h4" fontWeight="bold">
              Voter Dashboard
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="error"
            startIcon={<ExitToAppIcon />}
            onClick={handleSignOut}
            sx={{
              bgcolor: "error.light",
              "&:hover": { bgcolor: "error.main" },
              fontWeight: "bold",
            }}
          >
            Sign Out
          </Button>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper elevation={2} sx={{ mb: 3, borderRadius: 2, overflow: "hidden" }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab
            icon={tabIcons[0]}
            label="Available Polls"
            iconPosition="start"
          />
          <Tab
            icon={tabIcons[1]}
            label="My Voting History"
            iconPosition="start"
          />
          <Tab icon={tabIcons[2]} label="Results" iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Content */}
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper
          elevation={2}
          sx={{
            p: 3,
            textAlign: "center",
            borderRadius: 2,
            border: `1px solid ${theme.palette.error.light}`,
            bgcolor: theme.palette.error.light + "10",
          }}
        >
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={fetchPolls}
          >
            Retry
          </Button>
        </Paper>
      ) : (
        <Box p={1}>
          {/* Available Polls */}
          {activeTab === 0 && <PollList polls={availablePolls} />}

          {/* Voting History */}
          {activeTab === 1 && <VotingHistory />}

          {/* Results */}
          {activeTab === 2 && (
            <Box mb={3}>
              {endedPolls.length > 0 ? (
                <>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 3,
                      mb: 3,
                      borderRadius: 2,
                      bgcolor: theme.palette.grey[50],
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      Select a Poll to View Results
                    </Typography>
                    <FormControl fullWidth>
                      <InputLabel id="poll-select-label">Poll</InputLabel>
                      <Select
                        labelId="poll-select-label"
                        value={selectedPollId}
                        label="Poll"
                        onChange={handlePollChange}
                      >
                        {endedPolls.map((p) => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.title}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Paper>
                  {selectedPollId ? (
                    <VoterPollResults />
                  ) : (
                    <Alert severity="info">
                      Please select a poll to view results
                    </Alert>
                  )}
                </>
              ) : (
                <Alert severity="info">
                  No ended polls available. Results will appear once polls
                  complete.
                </Alert>
              )}
            </Box>
          )}
        </Box>
      )}
    </Container>
  );
};

export default VoterDashboard;
