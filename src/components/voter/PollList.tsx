import React from "react";
import {
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

interface Poll {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

interface PollListProps {
  polls: Poll[];
}

const PollList: React.FC<PollListProps> = ({ polls }) => {
  const navigate = useNavigate();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getPollStatus = (startDate: Date, endDate: Date) => {
    const now = new Date();
    if (now < startDate) {
      return { label: "Upcoming", color: "info" };
    } else if (now <= endDate) {
      return { label: "Active", color: "success" };
    } else {
      return { label: "Ended", color: "error" };
    }
  };

  const isCurrentlyActive = (startDate: Date, endDate: Date) => {
    const now = new Date();
    return startDate <= now && endDate >= now;
  };

  const handleVoteClick = (pollId: string) => {
    navigate(`/vote/${pollId}`);
  };

  if (polls.length === 0) {
    return (
      <Box sx={{ textAlign: "center", p: 4 }}>
        <Typography variant="h6">
          No active polls available at the moment.
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
          Check back later for upcoming polls.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Available Polls
      </Typography>
      <Grid container spacing={3}>
        {polls.map((poll) => {
          const status = getPollStatus(poll.startDate, poll.endDate);

          return (
            <Grid item xs={12} sm={6} md={4} key={poll.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="div" gutterBottom>
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
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Starts:
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(poll.startDate)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Ends:
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(poll.endDate)}
                    </Typography>
                  </Box>
                </CardContent>
                <Box sx={{ p: 2, pt: 0 }}>
                  <Chip
                    label={status.label}
                    color={status.color as "success" | "info" | "error"}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                </Box>
                <CardActions>
                  <Button
                    size="small"
                    variant="contained"
                    fullWidth
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