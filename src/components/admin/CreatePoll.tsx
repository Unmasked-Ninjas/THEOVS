import React, { useState } from "react";
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
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../firebase/config";
import { Candidate, PollType } from "../../types/Poll";

const CreatePoll: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [candidates, setCandidates] = useState<Candidate[]>([
    { id: "1", name: "", description: "" },
    { id: "2", name: "", description: "" },
  ]);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  ); // Default 1 week
  const [pollType, setPollType] = useState<PollType>("single");
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handlePollTypeChange = (event: SelectChangeEvent) => {
    setPollType(event.target.value as PollType);
  };

  const handleVisibilityChange = (event: SelectChangeEvent) => {
    setIsPublic(event.target.value === "public");
  };

  const addCandidate = () => {
    setCandidates([
      ...candidates,
      { id: `${candidates.length + 1}`, name: "", description: "" },
    ]);
  };

  const removeCandidate = (id: string) => {
    if (candidates.length <= 2) {
      setError("A poll must have at least two candidates");
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

    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const userId = auth.currentUser?.uid;
      if (!userId) {
        navigate("/login");
        return;
      }

      // Fetch the college name from the user database
      const userDoc = await getDoc(doc(db, "users", userId));
      const collegeName = userDoc.exists() ? userDoc.data().college : null;

      const newPoll = {
        title,
        description,
        candidates: candidates.map(({ id, ...rest }) => ({
          ...rest,
          votes: 0,
        })),
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        pollType,
        isPublic,
        createdBy: userId,
        createdAt: serverTimestamp(),
        totalVotes: 0,
        status: "active",
        collegeName, // Add college name to the poll data
      };

      await addDoc(collection(db, "polls"), newPoll);
      setSuccess(true);
      setTimeout(() => navigate("/admin/dashboard"), 2000);
    } catch (error) {
      console.error("Error creating poll:", error);
      setError("Failed to create poll. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(false);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md">
        <Box my={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            Create New Poll
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
                      <Grid item xs={11}>
                        <Typography variant="subtitle2">
                          Candidate {index + 1}
                        </Typography>
                      </Grid>
                      <Grid item xs={1} sx={{ textAlign: "right" }}>
                        <IconButton
                          onClick={() => removeCandidate(candidate.id || "")}
                          size="small"
                          color="error"
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
                              candidate.id || "",
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
                          value={candidate.description}
                          onChange={(e) =>
                            updateCandidate(
                              candidate.id || "",
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
                    />
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
                      >
                        <MenuItem value="single">Single Choice</MenuItem>
                        <MenuItem value="multiple">Multiple Choice</MenuItem>
                        <MenuItem value="ranked">Ranked Choice</MenuItem>
                      </Select>
                      <FormHelperText>
                        {pollType === "single"
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
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Poll"}
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
              Poll created successfully!
            </Alert>
          </Snackbar>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default CreatePoll;
