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
  isActive: boolean;
  isPublic: boolean;
  allowedColleges: Record<string, string> | null;
}

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
    if (!polls) {
      setFilteredPolls([]);
      return;
    }
    const userDomain = userEmail
      ? userEmail.substring(userEmail.lastIndexOf("@"))
      : null;

    const accessible = polls.filter((poll) => {
      if (poll.isPublic) return true;
      if (!userDomain || !poll.allowedColleges) return false;
      return Object.values(poll.allowedColleges)
        .map((d) => d.toLowerCase())
        .includes(userDomain.toLowerCase());
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

  const isCurrentlyActive = (start: Date, end: Date) => {
    const now = new Date();
    return start <= now && end >= now;
  };

  const handleVoteClick = (pollId: string) => {
    navigate(`/vote/${pollId}`);
  };

  const getCollegeNames = (poll: Poll) =>
    poll.allowedColleges
      ? Object.keys(poll.allowedColleges).join(", ")
      : "Public";

  if (filteredPolls.length === 0) {
    return (
      <Box sx={{ textAlign: "center", p: 4 }}>
        <Typography variant="h6">No polls available.</Typography>
        {!userEmail && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Log in to view private polls.
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
          const isCollegeSpecific = !poll.isPublic && poll.allowedColleges;
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
                    label={status.label}
                    color={status.color as any}
                    size="small"
                  />
                </Box>

                <CardActions>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleVoteClick(poll.id)}
                    disabled={!isCurrentlyActive(poll.startDate, poll.endDate)}
                  >
                    {isCurrentlyActive(poll.startDate, poll.endDate)
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
