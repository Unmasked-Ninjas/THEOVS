import React, { useEffect, useState } from "react";
import {
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Tooltip,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase/config";
import SchoolIcon from "@mui/icons-material/School";
import PublicIcon from "@mui/icons-material/Public";

export interface Poll {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: string;
  isPublic: boolean;
  college?: string[]; // Array of colleges that can access this poll
  totalVotes: number;
}

// Map of college names to their corresponding email domains
const colleges: Record<string, string> = {
  "Gmail College Kathmandu": "@gmail.com",
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

interface PollListProps {
  polls: Poll[];
}

const PollList: React.FC<PollListProps> = ({ polls }) => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [filteredPolls, setFilteredPolls] = useState<Poll[]>([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserEmail(user?.email ?? null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!polls || polls.length === 0) {
      setFilteredPolls([]);
      return;
    }

    // Filter polls based on user email domain and poll visibility
    const accessible = polls.filter((poll) => {
      // Public polls are visible to everyone
      if (poll.isPublic) {
        return true;
      }

      // If not logged in, only show public polls
      if (!userEmail) {
        return false;
      }

      // If poll doesn't have college restrictions or college array is empty, make it visible to all logged-in users
      if (!poll.college || poll.college.length === 0) {
        return true;
      }

      // Check if user's email domain matches any of the allowed colleges
      const userEmailLower = userEmail.toLowerCase();
      for (const collegeName of poll.college) {
        const collegeDomain = colleges[collegeName];
        if (
          collegeDomain &&
          userEmailLower.endsWith(collegeDomain.toLowerCase())
        ) {
          return true;
        }
      }

      return false;
    });

    setFilteredPolls(accessible);
  }, [polls, userEmail]);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);

  const getPollStatus = (start: Date, end: Date) => {
    const now = new Date();
    if (now < start) return { label: "Upcoming", color: "info" };
    if (now <= end) return { label: "Active", color: "success" };
    return { label: "Ended", color: "error" };
  };

  const isCurrentlyActive = (status: string) => {
    return status.toLowerCase() === "active";
  };

  const handleVoteClick = (pollId: string) => {
    navigate(`/vote/${pollId}`);
  };

  const getCollegeNames = (poll: Poll) => {
    if (poll.isPublic) return "Public";
    if (!poll.college || poll.college.length === 0)
      return "All registered users";
    return poll.college.join(", ");
  };

  if (filteredPolls.length === 0) {
    return (
      <Box sx={{ textAlign: "center", p: 4 }}>
        <Typography variant="h6">No polls available.</Typography>
        {!userEmail && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Log in to view all polls.
          </Alert>
        )}
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Available Polls
      </Typography>
      <Grid container spacing={3}>
        {filteredPolls.map((poll) => {
          const status = getPollStatus(poll.startDate, poll.endDate);
          const isCollegeSpecific =
            !poll.isPublic && poll.college && poll.college.length > 0;

          return (
            <Grid item xs={12} sm={6} md={4} key={poll.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                <Box sx={{ position: "absolute", top: 10, right: 10 }}>
                  <Tooltip
                    title={
                      isCollegeSpecific
                        ? `Limited to: ${getCollegeNames(poll)}`
                        : "Open to everyone"
                    }
                  >
                    {isCollegeSpecific ? (
                      <SchoolIcon color="primary" fontSize="small" />
                    ) : (
                      <PublicIcon color="action" fontSize="small" />
                    )}
                  </Tooltip>
                </Box>

                <CardContent sx={{ flexGrow: 1, pt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {poll.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {poll.description}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="caption">Starts:</Typography>
                    <Typography variant="body2">
                      {formatDate(poll.startDate)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="caption">Ends:</Typography>
                    <Typography variant="body2">
                      {formatDate(poll.endDate)}
                    </Typography>
                  </Box>
                </CardContent>

                <Box sx={{ p: 2, pt: 0 }}>
                  <Chip
                    label={getPollStatus(poll.startDate, poll.endDate).label}
                    color={
                      getPollStatus(poll.startDate, poll.endDate).color as any
                    }
                    size="small"
                  />
                </Box>

                <CardActions>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleVoteClick(poll.id)}
                    disabled={!isCurrentlyActive(poll.status)}
                  >
                    {isCurrentlyActive(poll.status)
                      ? "Vote Now"
                      : status.label === "Ended"
                      ? "View Results"
                      : "View Details"}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default PollList;
