import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../../firebase/config";

interface Candidate {
  id: string;
  name: string;
  description: string;
}

interface Poll {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

const VoteBallot: React.FC = () => {
  const { pollId } = useParams<{ pollId: string }>();
  const navigate = useNavigate();

  const [poll, setPoll] = useState<Poll | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!pollId) return;

    const fetchPollData = async () => {
      setLoading(true);
      try {
        // Get poll details
        const pollDoc = await getDoc(doc(db, "polls", pollId));

        if (!pollDoc.exists()) {
          setError("Poll not found");
          return;
        }

        const pollData = pollDoc.data();

        // Handle different date formats (string or Firestore timestamp)
        const startDate =
          typeof pollData.startDate === "string"
            ? new Date(pollData.startDate)
            : pollData.startDate?.toDate?.() || new Date();

        const endDate =
          typeof pollData.endDate === "string"
            ? new Date(pollData.endDate)
            : pollData.endDate?.toDate?.() || new Date();

        // Also check for status field instead of isActive if needed
        const isActive = pollData.isActive || pollData.status === "active";

        setPoll({
          id: pollDoc.id,
          title: pollData.title,
          description: pollData.description,
          startDate: startDate,
          endDate: endDate,
          isActive: isActive,
        });

        // Get candidates for this poll
        const candidatesRef = collection(db, "candidates");
        const candidatesQuery = query(
          candidatesRef,
          where("pollId", "==", pollId)
        );

        const candidatesSnapshot = await getDocs(candidatesQuery);
        const candidatesData: Candidate[] = [];

        candidatesSnapshot.forEach((doc) => {
          const data = doc.data();
          candidatesData.push({
            id: doc.id,
            name: data.name,
            description: data.description || "",
          });
        });

        setCandidates(candidatesData);

        // Check if user has already voted
        if (auth.currentUser) {
          const votesRef = collection(db, "votes");
          const voteQuery = query(
            votesRef,
            where("pollId", "==", pollId),
            where("userId", "==", auth.currentUser.uid)
          );

          const voteSnapshot = await getDocs(voteQuery);
          setHasVoted(!voteSnapshot.empty);
        }
      } catch (err) {
        console.error("Error fetching poll data:", err);
        setError("Failed to load the poll. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPollData();
  }, [pollId]);

  const handleCandidateChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSelectedCandidate(event.target.value);
  };

  const handleSubmitVote = async () => {
    if (!selectedCandidate || !auth.currentUser || !poll) return;

    setSubmitting(true);
    try {
      // Add vote to database
      await addDoc(collection(db, "votes"), {
        pollId,
        candidateId: selectedCandidate,
        userId: auth.currentUser.uid,
        timestamp: serverTimestamp(),
      });

      setSuccess(true);
      setHasVoted(true);

      // Wait 2 seconds before redirecting
      setTimeout(() => {
        navigate("/voter");
      }, 2000);
    } catch (err) {
      console.error("Error submitting vote:", err);
      setError("Failed to submit your vote. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isPollActive = () => {
    if (!poll) return false;
    const now = new Date();
    return poll.isActive && poll.startDate <= now && poll.endDate >= now;
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Button variant="contained" onClick={() => navigate("/voter")}>
            Return to Dashboard
          </Button>
        </Box>
      </Container>
    );
  }

  if (!poll) {
    return (
      <Container maxWidth="md">
        <Alert severity="warning" sx={{ mt: 4 }}>
          Poll information could not be loaded.
        </Alert>
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Button variant="contained" onClick={() => navigate("/voter")}>
            Return to Dashboard
          </Button>
        </Box>
      </Container>
    );
  }

  if (!isPollActive()) {
    return (
      <Container maxWidth="md">
        <Alert severity="info" sx={{ mt: 4 }}>
          This poll is not currently active.
        </Alert>
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Button variant="contained" onClick={() => navigate("/voter")}>
            Return to Dashboard
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {poll.title}
        </Typography>

        <Typography variant="body1" paragraph>
          {poll.description}
        </Typography>

        {hasVoted ? (
          <Alert severity="success" sx={{ mt: 3, mb: 3 }}>
            You have already cast your vote for this poll.
          </Alert>
        ) : success ? (
          <Alert severity="success" sx={{ mt: 3, mb: 3 }}>
            Your vote has been successfully recorded! Redirecting to
            dashboard...
          </Alert>
        ) : (
          <Box sx={{ mt: 4 }}>
            <FormControl component="fieldset" sx={{ width: "100%" }}>
              <FormLabel component="legend">Select your choice:</FormLabel>
              <RadioGroup
                aria-label="candidates"
                name="candidates"
                value={selectedCandidate}
                onChange={handleCandidateChange}
              >
                {candidates.map((candidate) => (
                  <Card
                    key={candidate.id}
                    sx={{
                      mb: 2,
                      border:
                        selectedCandidate === candidate.id
                          ? "2px solid #1976d2"
                          : "none",
                    }}
                  >
                    <CardContent>
                      <FormControlLabel
                        value={candidate.id}
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography variant="h6">
                              {candidate.name}
                            </Typography>
                            {candidate.description && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {candidate.description}
                              </Typography>
                            )}
                          </Box>
                        }
                        sx={{ width: "100%" }}
                      />
                    </CardContent>
                  </Card>
                ))}
              </RadioGroup>
            </FormControl>

            <Divider sx={{ my: 3 }} />

            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}
            >
              <Button variant="outlined" onClick={() => navigate("/voter")}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                disabled={!selectedCandidate || submitting}
                onClick={handleSubmitVote}
              >
                {submitting ? <CircularProgress size={24} /> : "Submit Vote"}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default VoteBallot;
