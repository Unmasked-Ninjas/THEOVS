import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  TextField,
  Button,
  Card,
  CardContent,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  SelectChangeEvent,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../firebase/config";
import { Candidate, Poll, PollType } from "../../types/Poll";

const EditPoll: React.FC = () => {
  const { pollId } = useParams<{ pollId: string }>();
  const navigate = useNavigate();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [pollType, setPollType] = useState<PollType>("single");
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    const fetchPollData = async () => {
      try {
        if (!pollId) {
          setError("Poll ID is missing");
          setLoading(false);
          return;
        }

        const pollRef = doc(db, "polls", pollId);
        const pollDoc = await getDoc(pollRef);

        if (!pollDoc.exists()) {
          setError("Poll not found");
          setLoading(false);
          return;
        }

        const pollData = { id: pollDoc.id, ...pollDoc.data() } as Poll;

        // Check if user is the poll creator
        if (pollData.createdBy !== auth.currentUser?.uid) {
          setError("You do not have permission to edit this poll");
          setLoading(false);
          return;
        }

        // Check if poll is already closed
        if (new Date() > new Date(pollData.endDate)) {
          setError("This poll has ended and cannot be edited");
          setLoading(false);
          return;
        }

        setPoll(pollData);
        setTitle(pollData.title);
        setDescription(pollData.description || "");
        // Add temporary IDs to candidates for editing
        setCandidates(
          pollData.candidates.map((candidate, index) => ({
            id: `${index + 1}`,
            ...candidate,
          }))
        );
        setStartDate(new Date(pollData.startDate));
        setEndDate(new Date(pollData.endDate));
        setPollType(pollData.pollType || "single");
        setIsPublic(pollData.isPublic !== false); // Default to true if not specified

        setLoading(false);
      } catch (error) {
        console.error("Error fetching poll data:", error);
        setError("Failed to load poll data");
        setLoading(false);
      }
    };

    fetchPollData();
  }, [pollId]);

  const handlePollTypeChange = (event: SelectChangeEvent) => {
    setPollType(event.target.value as PollType);
  };

  const handleVisibilityChange = (event: SelectChangeEvent) => {
    setIsPublic(event.target.value === "public");
  };

  const addCandidate = () => {
    setCandidates([
      ...candidates,
      { id: `${Date.now()}`, name: "", description: "" },
    ]);
  };

  const removeCandidate = (id: string) => {
    if (candidates.length <= 2) {
      setError("A poll must have at least two candidates");
      return;
    }

    // Check if candidate has votes
    const candidate = candidates.find((c) => c.id === id);
    if (candidate && candidate.votes && candidate.votes > 0) {
      setError("Cannot remove candidates that already have votes");
      return;
    }

    setCandidates(candidates.filter((candidate) => candidate.id !== id));
  };

  const updateCandidate = (
    id: string,
    field: keyof Candidate,
    value: string
  ) => {
    setCandidates(
      candidates.map((candidate) =>
        candidate.id === id ? { ...candidate, [field]: value } : candidate
      )
    );
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      setError("Poll title is required");
      return false;
    }

    if (!startDate || !endDate) {
      setError("Start and end dates are required");
      return false;
    }

    if (endDate <= startDate) {
      setError("End date must be after start date");
      return false;
    }

    if (endDate <= new Date()) {
      setError("End date must be in the future");
      return false;
    }

    const invalidCandidates = candidates.filter(
      (candidate) => !candidate.name.trim()
    );
    if (invalidCandidates.length > 0) {
      setError("All candidates must have a name");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !pollId) return;

    try {
      setSaving(true);
      setError(null);

      // Prepare candidate data, preserving votes
      const updatedCandidates = candidates.map(({ id, ...rest }) => {
        // Find the original candidate (if exists) to preserve vote count
        const originalCandidate = poll?.candidates.find(
          (c, index) => index === parseInt(id as string) - 1
        );
        return {
          ...rest,
          votes: originalCandidate?.votes || 0,
        };
      });

      const updatedPoll = {
        title,
        description,
        candidates: updatedCandidates,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        pollType,
        isPublic,
        updatedAt: new Date().toISOString(),
      };

      const pollRef = doc(db, "polls", pollId);
      await updateDoc(pollRef, updatedPoll);

      setSuccess(true);
      setTimeout(() => navigate("/admin/dashboard"), 2000);
    } catch (error) {
      console.error("Error updating poll:", error);
      setError("Failed to update poll. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(false);
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

  if (error && !poll) {
    return (
      <Container maxWidth="md">
        <Box my={4} textAlign="center">
          <Typography variant="h5" color="error" gutterBottom>
            {error}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/admin/dashboard")}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md">
        <Box my={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            Edit Poll
          </Typography>

          <form onSubmit={handleSubmit}>
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      label="Poll Title"
                      fullWidth
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Description"
                      fullWidth
                      multiline
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="h6">Candidates</Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={addCandidate}
                    variant="outlined"
                    size="small"
                  >
                    Add Candidate
                  </Button>
                </Box>

                {candidates.map((candidate, index) => (
                  <Box
                    key={candidate.id}
                    mb={2}
                    p={2}
                    bgcolor="#f9f9f9"
                    borderRadius={1}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={10} sm={11}>
                        <Typography variant="subtitle2">
                          Candidate {index + 1}
                          {candidate.votes &&
                            candidate.votes > 0 &&
                            ` (${candidate.votes} votes)`}
                        </Typography>
                      </Grid>
                      <Grid item xs={2} sm={1} sx={{ textAlign: "right" }}>
                        <IconButton
                          onClick={() =>
                            removeCandidate(candidate.id as string)
                          }
                          size="small"
                          color="error"
                          disabled={!!(candidate.votes && candidate.votes > 0)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Name"
                          fullWidth
                          required
                          value={candidate.name}
                          onChange={(e) =>
                            updateCandidate(
                              candidate.id as string,
                              "name",
                              e.target.value
                            )
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Description (Optional)"
                          fullWidth
                          value={candidate.description || ""}
                          onChange={(e) =>
                            updateCandidate(
                              candidate.id as string,
                              "description",
                              e.target.value
                            )
                          }
                        />
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Poll Settings
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <DateTimePicker
                      label="Start Date & Time"
                      value={startDate}
                      onChange={(newValue) => setStartDate(newValue)}
                      disabled={!!(poll?.totalVotes && poll.totalVotes > 0)}
                    />
                    {poll?.totalVotes && poll.totalVotes > 0 && (
                      <FormHelperText>
                        Cannot change start date after voting has begun
                      </FormHelperText>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DateTimePicker
                      label="End Date & Time"
                      value={endDate}
                      onChange={(newValue) => setEndDate(newValue)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Voting Type</InputLabel>
                      <Select
                        value={pollType}
                        label="Voting Type"
                        onChange={handlePollTypeChange}
                        disabled={!!(poll?.totalVotes && poll.totalVotes > 0)}
                      >
                        <MenuItem value="single">Single Choice</MenuItem>
                        <MenuItem value="multiple">Multiple Choice</MenuItem>
                        <MenuItem value="ranked">Ranked Choice</MenuItem>
                      </Select>
                      <FormHelperText>
                        {poll?.totalVotes && poll.totalVotes > 0
                          ? "Cannot change voting type after voting has begun"
                          : pollType === "single"
                          ? "Voters select one candidate only"
                          : pollType === "multiple"
                          ? "Voters can select multiple candidates"
                          : "Voters rank candidates in order of preference"}
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Visibility</InputLabel>
                      <Select
                        value={isPublic ? "public" : "private"}
                        label="Visibility"
                        onChange={handleVisibilityChange}
                      >
                        <MenuItem value="public">Public</MenuItem>
                        <MenuItem value="private">
                          Private (Invited Only)
                        </MenuItem>
                      </Select>
                      <FormHelperText>
                        {isPublic
                          ? "Anyone with the link can vote"
                          : "Only specific users can access and vote"}
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Box display="flex" justifyContent="flex-end" mt={3}>
              <Button
                variant="outlined"
                onClick={() => navigate("/admin/dashboard")}
                sx={{ mr: 2 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </Box>
          </form>

          <Snackbar
            open={!!error}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
          >
            <Alert
              onClose={handleCloseSnackbar}
              severity="error"
              sx={{ width: "100%" }}
            >
              {error}
            </Alert>
          </Snackbar>

          <Snackbar
            open={success}
            autoHideDuration={2000}
            onClose={handleCloseSnackbar}
          >
            <Alert
              onClose={handleCloseSnackbar}
              severity="success"
              sx={{ width: "100%" }}
            >
              Poll updated successfully!
            </Alert>
          </Snackbar>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default EditPoll;