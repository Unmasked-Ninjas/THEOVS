import React, { useState } from "react";
import {
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Modal,
  Paper,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

interface Poll {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  candidates?: { name: string; description?: string; votes?: number }[];
  totalVotes?: number;
}

interface PollListProps {
  polls: Poll[];
}

const PollList: React.FC<PollListProps> = ({ polls }) => {
  const navigate = useNavigate();
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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
    } else if (now >= startDate && now <= endDate) {
      return { label: "Active", color: "success" };
    } else {
      return { label: "Ended", color: "error" };
    }
  };

  const handleViewDetailsClick = async (pollId: string) => {
    const pollRef = doc(db, "polls", pollId);

    try {
      const pollDoc = await getDoc(pollRef);
      if (pollDoc.exists()) {
        const pollData = pollDoc.data();
        setSelectedPoll({
          id: pollId,
          title: pollData.title,
          description: pollData.description,
          startDate: new Date(pollData.startDate),
          endDate: new Date(pollData.endDate),
          isActive: pollData.isActive,
          candidates: pollData.candidates || [], // Include candidates
          totalVotes: pollData.totalVotes || 0, // Include total votes
        });
        setModalOpen(true); // Open the modal
      } else {
        alert("Poll not found.");
      }
    } catch (error) {
      console.error("Error fetching poll details:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPoll(null);
  };

  const handleVoteClick = async (pollId: string, pollTitle: string) => {
    if (!auth.currentUser) {
      alert("You must be signed in to vote.");
      return;
    }

    const userId = auth.currentUser.uid;
    const pollRef = doc(db, "polls", pollId);

    try {
      const pollDoc = await getDoc(pollRef);
      if (pollDoc.exists()) {
        const pollData = pollDoc.data();
        if (pollData.voters?.includes(userId)) {
          navigate(`/vote/${pollId}`); // Redirect to VoteBallot if registered
        } else {
          alert(`You have not registered to vote in this poll "${pollTitle}".`);
        }
      } else {
        alert("Poll not found.");
      }
    } catch (error) {
      console.error("Error checking voter registration:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleRegisterClick = async (pollId: string, pollTitle: string) => {
    if (!auth.currentUser) {
      alert("You must be signed in to register.");
      return;
    }

    const userId = auth.currentUser.uid;
    const pollRef = doc(db, "polls", pollId);

    try {
      const pollDoc = await getDoc(pollRef);
      if (pollDoc.exists()) {
        const pollData = pollDoc.data();
        if (pollData.voters?.includes(userId)) {
          alert("You are already registered for this poll.");
          return;
        }

        const confirmRegister = window.confirm(
          `Would you like to register to vote for poll "${pollTitle}"?`
        );

        if (confirmRegister) {
          await updateDoc(pollRef, {
            voters: arrayUnion(userId), // Append the user ID to the voters array
          });
          alert("You have successfully registered to vote in this poll.");
        }
      } else {
        alert("Poll not found.");
      }
    } catch (error) {
      console.error("Error registering for poll:", error);
      alert("An error occurred. Please try again.");
    }
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
                  {status.label === "Upcoming" && (
                    <>
                      <Button
                        size="small"
                        variant="outlined"
                        fullWidth
                        onClick={() => handleViewDetailsClick(poll.id)} // Open modal with poll details
                      >
                        View Details
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={() => handleRegisterClick(poll.id, poll.title)} // Handle registration logic
                      >
                        Register
                      </Button>
                    </>
                  )}
                  {status.label === "Active" && (
                    <>
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={() => handleVoteClick(poll.id, poll.title)} // Check voter registration before voting
                      >
                        Vote Now
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        fullWidth
                        onClick={() => handleViewDetailsClick(poll.id)} // Open modal with poll details
                      >
                        View Details
                      </Button>
                    </>
                  )}
                  {status.label === "Ended" && (
                    <Button
                      size="small"
                      variant="outlined"
                      fullWidth
                      onClick={() => handleViewDetailsClick(poll.id)} // Open modal with poll results
                    >
                      View Results
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Modal for Poll Details */}
      <Modal open={modalOpen} onClose={handleCloseModal}>
        <Paper
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            maxHeight: "90vh", // Enable scrolling for overflowing content
            overflowY: "auto",
            p: 4,
            outline: "none",
          }}
        >
          {selectedPoll && (
            <>
              <Typography variant="h6" gutterBottom>
                {selectedPoll.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedPoll.description}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Start Date:</strong> {formatDate(selectedPoll.startDate)}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>End Date:</strong> {formatDate(selectedPoll.endDate)}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Status:</strong> {getPollStatus(selectedPoll.startDate, selectedPoll.endDate).label}
              </Typography>
              {getPollStatus(selectedPoll.startDate, selectedPoll.endDate).label === "Ended" && (
                <>
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    Results Visualization
                  </Typography>
                  <Box sx={{ height: 300, mt: 0.5 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={selectedPoll.candidates?.map((candidate, index) => ({
                          name: candidate.name,
                          votes: candidate.votes || 0,
                          percentage:
                            (selectedPoll.totalVotes ?? 0) > 0
                              ? ((candidate.votes || 0) / (selectedPoll.totalVotes ?? 1)) * 100
                              : 0,
                          fill: COLORS[index % COLORS.length],
                        }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value} votes`, "Votes"]} />
                        <Legend />
                        <Bar dataKey="votes" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box sx={{ height: 50, mt: 1 }}>
                    <ResponsiveContainer width="100%" height="30%">
                      <PieChart>
                        <Pie
                          data={selectedPoll.candidates?.map((candidate, index) => ({
                            name: candidate.name,
                            votes: candidate.votes || 0,
                            percentage:
                              (selectedPoll.totalVotes ?? 0) > 0
                                ? ((candidate.votes || 0) / (selectedPoll.totalVotes ?? 1)) * 100
                                : 0,
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="votes"
                          nameKey="name"
                          label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                        >
                          {selectedPoll.candidates?.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} votes`, "Votes"]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Typography variant="h6" sx={{ mt: 3 }}>
                    Vote Distribution
                  </Typography>
                  <List>
                    {selectedPoll.candidates?.map((candidate, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`${candidate.name}: ${candidate.votes || 0} votes`}
                          secondary={`Percentage: ${
                            (selectedPoll.totalVotes ?? 0) > 0
                              ? ((candidate.votes || 0) / (selectedPoll.totalVotes ?? 1)) * 100
                              : 0
                          }%`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleCloseModal}
                sx={{ mt: 2 }}
              >
                Close
              </Button>
            </>
          )}
        </Paper>
      </Modal>
    </Box>
  );
};

export default PollList;