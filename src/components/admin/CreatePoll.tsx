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
  Checkbox,
  ListItemText,
  OutlinedInput,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../firebase/config";
import { Candidate, PollType } from "../../types/Poll";

// College list
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

const CreatePoll: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([
    { id: "1", name: "", description: "" },
    { id: "2", name: "", description: "" },
  ]);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );
  const [pollType, setPollType] = useState<PollType>("single");
  const [isPublic, setIsPublic] = useState(true);
  const [selectedColleges, setSelectedColleges] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePollTypeChange = (e: SelectChangeEvent) => {
    setPollType(e.target.value as PollType);
  };

  const handleVisibilityChange = (e: SelectChangeEvent) => {
    const v = e.target.value;
    setIsPublic(v === "public");
    if (v === "public") setSelectedColleges([]);
  };

  const handleCollegeChange = (
    e: SelectChangeEvent<typeof selectedColleges>
  ) => {
    const { value } = e.target;
    setSelectedColleges(typeof value === "string" ? value.split(",") : value);
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
    setCandidates(candidates.filter((c) => c.id !== id));
  };

  const updateCandidate = (
    id: string,
    field: keyof Candidate,
    value: string
  ) => {
    setCandidates(
      candidates.map((c) => (c.id === id ? { ...c, [field]: value } : c))
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
    if (candidates.some((c) => !c.name.trim())) {
      setError("All candidates must have a name");
      return false;
    }
    if (!isPublic && selectedColleges.length === 0) {
      setError("Please select at least one college");
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

      const newPoll = {
        title,
        description,
        candidates: candidates.map(({ id, ...rest }) => ({
          ...rest,
          votes: 0,
        })),
        startDate: startDate!.toISOString(),
        endDate: endDate!.toISOString(),
        pollType,
        isPublic,
        // store array of college-names just like EditPoll stores `college: string`
        college: isPublic ? [] : selectedColleges,
        createdBy: userId,
        createdAt: serverTimestamp(),
        totalVotes: 0,
        status: "active",
      };

      await addDoc(collection(db, "polls"), newPoll);
      setSuccess(true);
      setTimeout(() => navigate("/admin/dashboard"), 2000);
    } catch (err) {
      console.error("Error creating poll:", err);
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
          <Typography variant="h4" gutterBottom>
            Create New Poll
          </Typography>
          <form onSubmit={handleSubmit}>
            {/* Basic Info */}
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

            {/* Candidates */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" mb={2}>
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
                {candidates.map((c, i) => (
                  <Box
                    key={c.id}
                    mb={2}
                    p={2}
                    bgcolor="#f9f9f9"
                    borderRadius={1}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={11}>
                        <Typography variant="subtitle2">
                          Candidate {i + 1}
                        </Typography>
                      </Grid>
                      <Grid item xs={1} sx={{ textAlign: "right" }}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeCandidate(c.id as string)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Name"
                          fullWidth
                          required
                          value={c.name}
                          onChange={(e) =>
                            updateCandidate(
                              c.id as string,
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
                          value={c.description}
                          onChange={(e) =>
                            updateCandidate(
                              c.id as string,
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

            {/* Settings */}
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
                      onChange={(dt) => setStartDate(dt)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DateTimePicker
                      label="End Date & Time"
                      value={endDate}
                      onChange={(dt) => setEndDate(dt)}
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
                          ? "Select one candidate only"
                          : pollType === "multiple"
                          ? "Can select multiple"
                          : "Rank in order of preference"}
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Visibility</InputLabel>
                      <Select
                        value={isPublic ? "public" : "college"}
                        label="Visibility"
                        onChange={handleVisibilityChange}
                      >
                        <MenuItem value="public">Public</MenuItem>
                        <MenuItem value="college">College Specific</MenuItem>
                      </Select>
                      <FormHelperText>
                        {isPublic
                          ? "Anyone with link can vote"
                          : "Only selected colleges can vote"}
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                  {!isPublic && (
                    <Grid item xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>Select Colleges</InputLabel>
                        <Select
                          multiple
                          value={selectedColleges}
                          onChange={handleCollegeChange}
                          input={<OutlinedInput label="Select Colleges" />}
                          renderValue={(sel) => (sel as string[]).join(", ")}
                        >
                          {Object.keys(colleges).map((name) => (
                            <MenuItem key={name} value={name}>
                              <Checkbox
                                checked={selectedColleges.includes(name)}
                              />
                              <ListItemText
                                primary={name}
                                secondary={colleges[name]}
                              />
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>
                          Only users from these colleges can vote
                        </FormHelperText>
                      </FormControl>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Actions */}
            <Box display="flex" justifyContent="flex-end" mt={3}>
              <Button
                variant="outlined"
                onClick={() => navigate("/admin/dashboard")}
                sx={{ mr: 2 }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={loading}>
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
              severity="error"
              onClose={handleCloseSnackbar}
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
              severity="success"
              onClose={handleCloseSnackbar}
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
