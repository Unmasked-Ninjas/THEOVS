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
  Checkbox,
  ListItemText,
  OutlinedInput,
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

const EditPoll: React.FC = () => {
  const { pollId } = useParams<{ pollId: string }>();
  const navigate = useNavigate();

  const [poll, setPoll] = useState<Poll | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [pollType, setPollType] = useState<PollType>("single");
  const [isPublic, setIsPublic] = useState(true);
  const [selectedColleges, setSelectedColleges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchPoll = async () => {
      if (!pollId) return setLoading(false);

      try {
        const ref = doc(db, "polls", pollId);
        const snap = await getDoc(ref);
        if (!snap.exists()) throw new Error("Poll not found");

        const data = { id: snap.id, ...snap.data() } as Poll;

        if (data.createdBy !== auth.currentUser?.uid) {
          throw new Error("No permission to edit");
        }
        if (new Date() > new Date(data.endDate)) {
          throw new Error("Poll has ended");
        }

        setPoll(data);
        setTitle(data.title);
        setDescription(data.description || "");
        setCandidates(
          data.candidates.map((c, i) => ({ id: `${i + 1}`, ...c }))
        );
        setStartDate(new Date(data.startDate));
        setEndDate(new Date(data.endDate));
        setPollType(data.pollType);
        setIsPublic(data.isPublic !== false);
        // initialize selectedColleges from existing poll.college array
        setSelectedColleges(Array.isArray(data.college) ? data.college : []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPoll();
  }, [pollId]);

  const handlePollTypeChange = (e: SelectChangeEvent) =>
    setPollType(e.target.value as PollType);

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

  const addCandidate = () =>
    setCandidates([
      ...candidates,
      { id: `${Date.now()}`, name: "", description: "" },
    ]);

  const removeCandidate = (id: string) => {
    if (candidates.length <= 2) {
      return setError("At least two candidates required");
    }
    const c = candidates.find((c) => c.id === id);
    if (c?.votes && c.votes > 0) {
      return setError("Cannot remove candidate with votes");
    }
    setCandidates(candidates.filter((c) => c.id !== id));
  };

  const updateCandidate = (id: string, field: keyof Candidate, val: string) =>
    setCandidates(
      candidates.map((c) => (c.id === id ? { ...c, [field]: val } : c))
    );

  const validate = (): boolean => {
    if (!title.trim()) {
      setError("Title is required");
      return false;
    }

    if (!startDate || !endDate) {
      setError("Start and end dates required");
      return false;
    }

    if (endDate <= startDate) {
      setError("End date must follow start date");
      return false;
    }

    if (endDate <= new Date()) {
      setError("End date must be in the future");
      return false;
    }

    if (candidates.some((c) => !c.name.trim())) {
      setError("All candidates need a name");
      return false;
    }

    if (!isPublic && selectedColleges.length === 0) {
      setError("Select at least one college");
      return false;
    }

    // clear any existing error
    setError(null);
    return true;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !pollId) return;

    try {
      setSaving(true);
      setError(null);

      const updatedCandidates = candidates.map(({ id, ...rest }) => {
        const orig = poll?.candidates[parseInt(id as string, 10) - 1];
        return { ...rest, votes: orig?.votes || 0 };
      });

      const updatedPoll = {
        title,
        description,
        candidates: updatedCandidates,
        startDate: startDate!.toISOString(),
        endDate: endDate!.toISOString(),
        pollType,
        isPublic,
        college: isPublic ? [] : selectedColleges,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, "polls", pollId), updatedPoll);
      setSuccess(true);
      setTimeout(() => navigate("/admin/dashboard"), 2000);
    } catch (err) {
      console.error(err);
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md">
        <Box my={4}>
          <Typography variant="h4" gutterBottom>
            Edit Poll
          </Typography>

          <form onSubmit={handleSubmit}>
            {/* Basic Info */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6">Basic Information</Typography>
                <Grid container spacing={3} mt={1}>
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
                      <Grid item xs={10}>
                        <Typography variant="subtitle2">
                          {`Candidate ${i + 1}`}
                          {c.votes ? ` (${c.votes} votes)` : ""}
                        </Typography>
                      </Grid>
                      <Grid item xs={2} textAlign="right">
                        <IconButton
                          size="small"
                          color="error"
                          disabled={!!c.votes}
                          onClick={() => removeCandidate(c.id || "")}
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
                            updateCandidate(c.id || "", "name", e.target.value)
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
                              c.id || "",
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
                <Typography variant="h6">Poll Settings</Typography>
                <Grid container spacing={3} mt={1}>
                  <Grid item xs={12} sm={6}>
                    <DateTimePicker
                      label="Start Date & Time"
                      value={startDate}
                      onChange={(dt) => setStartDate(dt)}
                      disabled={!!poll?.totalVotes}
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
                        disabled={!!poll?.totalVotes}
                      >
                        <MenuItem value="single">Single Choice</MenuItem>
                        <MenuItem value="multiple">Multiple Choice</MenuItem>
                        <MenuItem value="ranked">Ranked Choice</MenuItem>
                      </Select>
                      <FormHelperText>
                        {pollType === "single"
                          ? "One choice only"
                          : pollType === "multiple"
                          ? "Select multiple"
                          : "Rank preferences"}
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
                          ? "Anyone with link"
                          : "Restricted to selected colleges"}
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
                          renderValue={(vals) => (vals as string[]).join(", ")}
                          MenuProps={{
                            PaperProps: {
                              style: { maxHeight: 224, width: 250 },
                            },
                          }}
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
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </Box>
          </form>

          <Snackbar
            open={!!error}
            autoHideDuration={6000}
            onClose={() => setError(null)}
          >
            <Alert
              severity="error"
              onClose={() => setError(null)}
              sx={{ width: "100%" }}
            >
              {error}
            </Alert>
          </Snackbar>
          <Snackbar
            open={success}
            autoHideDuration={2000}
            onClose={() => setSuccess(false)}
          >
            <Alert
              severity="success"
              onClose={() => setSuccess(false)}
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
