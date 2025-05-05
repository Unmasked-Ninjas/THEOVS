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
  updateDoc,
  increment,
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
        console.log("Fetching poll with ID:", pollId);

        // Get poll details - using try/catch to better identify errors
        try {
          const pollRef = doc(db, "polls", pollId);
          console.log("Poll reference created:", pollRef);

          const pollDoc = await getDoc(pollRef);
          console.log("Poll document fetched, exists:", pollDoc.exists());

          if (!pollDoc.exists()) {
            setError("Poll not found");
            setLoading(false);
            return;
          }

          const pollData = pollDoc.data();
          console.log("Poll data retrieved:", pollData);

          // Handle date formats
          const startDate =
            typeof pollData.startDate === "string"
              ? new Date(pollData.startDate)
              : pollData.startDate?.toDate?.() || new Date();
          const endDate =
            typeof pollData.endDate === "string"
              ? new Date(pollData.endDate)
              : pollData.endDate?.toDate?.() || new Date();

          const isActive = pollData.isActive || pollData.status === "active";

          setPoll({
            id: pollDoc.id,
            title: pollData.title,
            description: pollData.description,
            startDate,
            endDate,
            isActive,
          });

          // Create candidates with string IDs
          if (Array.isArray(pollData.candidates)) {
            const candidates = pollData.candidates.map(
              (cand: any, idx: number) => ({
                id: String(idx + 1), // Converting to string explicitly
                ...cand, // spreads name & description into the new object
              })
            );
            console.log("Candidates loaded:", candidates);
            setCandidates(candidates);
          } else {
            console.warn("No candidates array found in poll data:", pollData);
            setCandidates([]);
          }
        } catch (pollErr) {
          console.error("Error fetching poll document:", pollErr);
          setError(
            `Failed to load poll document: ${
              pollErr instanceof Error ? pollErr.message : String(pollErr)
            }`
          );
          setLoading(false);
          return;
        }

        // Check if user has already voted
        try {
          if (auth.currentUser) {
            const votesRef = collection(db, "votes");
            const voteQuery = query(
              votesRef,
              where("pollId", "==", pollId),
              where("userId", "==", auth.currentUser.uid)
            );

            console.log("Checking if user has voted:", {
              pollId,
              userId: auth.currentUser.uid,
            });

            const voteSnapshot = await getDocs(voteQuery);
            const hasVoted = !voteSnapshot.empty;
            console.log("User has voted:", hasVoted);
            setHasVoted(hasVoted);
          } else {
            console.warn("No authenticated user found");
          }
        } catch (voteErr) {
          console.error("Error checking vote status:", voteErr);
          // Continue despite vote checking error
        }
      } catch (err) {
        console.error("Error in fetchPollData:", err);
        setError(
          `Failed to load the poll: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPollData();
  }, [pollId]);

  const handleCandidateChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    console.log("Selected candidate ID:", event.target.value);
    setSelectedCandidate(event.target.value);
  };

  const handleSubmitVote = async () => {
    if (!selectedCandidate || !auth.currentUser || !poll || !pollId) {
      console.log("Missing data:", {
        hasSelectedCandidate: !!selectedCandidate,
        selectedCandidateValue: selectedCandidate,
        hasCurrentUser: !!auth.currentUser,
        hasPoll: !!poll,
        hasPollId: !!pollId,
      });
      return;
    }

    setSubmitting(true);
    try {
      // Prepare vote data
      const voteData = {
        pollId,
        candidateId: selectedCandidate,
        userId: auth.currentUser.uid,
        timestamp: serverTimestamp(),
      };
      console.log("Submitting vote:", voteData);

      // Add vote to database
      const docRef = await addDoc(collection(db, "votes"), voteData);
      console.log("Vote submitted with ID:", docRef.id);

      // Update poll vote counts
      try {
        const pollDocRef = doc(db, "polls", pollId);

        // 1) fetch the current array:
        const pollSnap = await getDoc(pollDocRef);
        if (!pollSnap.exists()) throw new Error("Poll disappeared!");

        const data = pollSnap.data();
        const oldCandidates = Array.isArray(data.candidates)
          ? (data.candidates as Array<{
              name: string;
              description?: string;
              votes?: number;
            }>)
          : [];

        // 2) bump the one you want:
        const candidateIndex = parseInt(selectedCandidate, 10) - 1;
        const newCandidates = oldCandidates.map((c, idx) => {
          if (idx === candidateIndex) {
            return {
              ...c,
              votes: (c.votes || 0) + 1,
            };
          }
          return c;
        });

        // 3) write back both the new array and increment totalVotes:
        await updateDoc(pollDocRef, {
          candidates: newCandidates,
          totalVotes: increment(1),
        });

        console.log("Successfully bumped votes in array!");
      } catch (updateErr) {
        console.warn("Could not update vote counts:", updateErr);
      }

      setSuccess(true);
      setHasVoted(true);
      setTimeout(() => navigate("/voter"), 2000);
    } catch (err) {
      console.error("Error submitting vote:", err);
      setError(
        `Failed to submit your vote: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
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

  if (!poll || !isPollActive()) {
    return (
      <Container maxWidth="md">
        <Alert severity={!poll ? "warning" : "info"} sx={{ mt: 4 }}>
          {!poll
            ? "Poll information could not be loaded."
            : "This poll is not currently active."}
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
                    onClick={() => setSelectedCandidate(candidate.id)}
                    sx={{
                      mb: 2,
                      border:
                        selectedCandidate === candidate.id
                          ? "2px solid #1976d2"
                          : "none",
                      cursor: "pointer",
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
