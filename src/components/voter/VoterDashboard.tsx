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
import PollList, { Poll } from "./PollList";
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

const VoterDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedPollId, setSelectedPollId] = useState<string>("");
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    fetchPolls();
    const pid = searchParams.get("pollId");
    if (pid) setSelectedPollId(pid);
  }, []);

  const fetchPolls = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "polls"));
      const data: Poll[] = snap.docs.map((doc) => {
        const d = doc.data() as any;
        return {
          id: doc.id,
          title: d.title,
          description: d.description,
          startDate:
            typeof d.startDate === "string"
              ? new Date(d.startDate)
              : d.startDate.toDate(),
          endDate:
            typeof d.endDate === "string"
              ? new Date(d.endDate)
              : d.endDate.toDate(),
          isActive: d.status === "active",
          isPublic: d.isPublic,
          allowedColleges: d.college ? { [d.college]: d.college } : null,
        };
      });
      setPolls(data);
      if (data.length && !selectedPollId) {
        setSelectedPollId(data[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch polls");
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const available = polls.filter((p) => {
    const endPlusOne = new Date(p.endDate.getTime() + 86400000);
    return p.isActive || p.startDate > now || endPlusOne >= now;
  });
  const ended = polls.filter((p) => !p.isActive);

  const handleTabChange = (_: any, v: number) => {
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
    } catch {}
  };

  const handlePollChange = (e: SelectChangeEvent<string>) => {
    setSelectedPollId(e.target.value);
    if (activeTab === 2) {
      setSearchParams({ pollId: e.target.value });
    }
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
          {activeTab === 0 && <PollList polls={available} />}
          {activeTab === 1 && <VotingHistory />}
          {activeTab === 2 && (
            <Box mb={3}>
              {ended.length > 0 ? (
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
                        {ended.map((p) => (
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
                <Alert severity="info">No ended polls available.</Alert>
              )}
            </Box>
          )}
        </Box>
      )}
    </Container>
  );
};

export default VoterDashboard;
