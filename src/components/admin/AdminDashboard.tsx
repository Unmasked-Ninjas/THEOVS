import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Button,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../../firebase/config";
import PollCard from "./PollCard";
import { Poll } from "../../types/Poll";
//import Grid from "@mui/material/Grid2";
import Grid from "@mui/material/Grid";

const AdminDashboard: React.FC = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          navigate("/login");
          return;
        }

        const pollsRef = collection(db, "polls");
        const q = query(pollsRef, where("createdBy", "==", userId));
        const querySnapshot = await getDocs(q);

        const pollData: Poll[] = [];
        querySnapshot.forEach((doc) => {
          pollData.push({ id: doc.id, ...doc.data() } as Poll);
        });

        setPolls(pollData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching polls:", error);
        setLoading(false);
      }
    };

    fetchPolls();
  }, [navigate]);

  const handleCreatePoll = () => {
    navigate("/admin/create-poll");
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            Admin Dashboard
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreatePoll}
          >
            Create New Poll
          </Button>
        </Box>

        <Box mb={4}>
          <Typography variant="h5" component="h2" gutterBottom>
            Your Polls
          </Typography>
          {polls.length === 0 ? (
            <Card>
              <CardContent>
                <Typography
                  variant="body1"
                  color="textSecondary"
                  align="center"
                >
                  You haven't created any polls yet. Create your first poll to
                  get started!
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {polls.map((poll) => (
                <Grid item xs={12} sm={6} md={4} key={poll.id}>
                  <PollCard poll={poll} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default AdminDashboard;
