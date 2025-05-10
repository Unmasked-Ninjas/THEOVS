import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  CircularProgress,
  Button,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent, // Import SelectChangeEvent
  Modal,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { db, auth } from "../../firebase/config";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
];

const colleges = [
  "Herald College Kathmandu",
  "Islington College",
  "Biratnagar International College",
  "Informatics College Pokhara",
  "Fishtail Mountain College",
  "Itahari International College",
  "Apex College",
  "International School of Tourism and Hotel Management (IST)",
  "CG Institute of Management",
];

const statuses = ["All", "Upcoming", "Active", "Ended"];
const sortOptions = ["Ascending", "Descending"];

interface Poll {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  totalVotes?: number;
  collegeName: string;
  status: string;
  candidates?: { name: string; description?: string; votes?: number }[]; // Add votes as an optional property
}

const PollResults: React.FC = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [filteredPolls, setFilteredPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCollege, setSelectedCollege] = useState<string>("");
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [sortOrder, setSortOrder] = useState<string>("Ascending");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

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

  const handleViewDetailsClick = (poll: Poll) => {
    setSelectedPoll(poll);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPoll(null);
  };

  useEffect(() => {
    const fetchCollegesAndPolls = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          setLoading(false);
          return;
        }

        // Fetch user data to get the college name of the logged-in user
        const userDoc = await getDoc(doc(db, "users", userId));
        const userCollege = userDoc.data()?.college;

        if (!userCollege) {
          setLoading(false);
          return;
        }

        // Fetch all polls
        const pollsRef = collection(db, "polls");
        const querySnapshot = await getDocs(pollsRef);

        const allPolls: Poll[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Poll[];

        setPolls(allPolls);

        // Set default college to the logged-in user's college
        setSelectedCollege(userCollege);
        setFilteredPolls(
          allPolls.filter((poll) => poll.collegeName === userCollege)
        );

        setLoading(false);
      } catch (error) {
        console.error("Error fetching polls or user data:", error);
        setLoading(false);
      }
    };

    fetchCollegesAndPolls();
  }, []);

  const handleCollegeChange = (event: SelectChangeEvent<string>) => {
    const college = event.target.value;
    setSelectedCollege(college);
    setFilteredPolls(polls.filter((poll) => poll.collegeName === college));
  };

  const applyFilters = (
    college: string,
    status: string,
    order: string,
    from: string,
    to: string
  ) => {
    let filtered = polls;

    if (college) {
      filtered = filtered.filter((poll) => poll.collegeName === college);
    }

    if (status !== "All") {
      filtered = filtered.filter((poll) => poll.status === status.toLowerCase());
    }

    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      filtered = filtered.filter((poll) => {
        const createdAt = new Date(poll.createdAt);
        return createdAt >= fromDate && createdAt <= toDate;
      });
    }

    if (order === "Ascending") {
      filtered = filtered.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } else {
      filtered = filtered.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    setFilteredPolls(filtered);
  };

  const handleApplyFilters = () => {
    applyFilters(selectedCollege, filterStatus, sortOrder, dateFrom, dateTo);
    setAdvancedFilterOpen(false);
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
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            All Poll Results
          </Typography>
          <Box display="flex" gap={2}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel
                id="college-filter-label"
                sx={{
                  backgroundColor: "white",
                  px: 0.5,
                }}
              >
                Select College
              </InputLabel>
              <Select
                labelId="college-filter-label"
                value={selectedCollege}
                onChange={handleCollegeChange}
              >
                {colleges.map((college) => (
                  <MenuItem key={college} value={college}>
                    {college}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setAdvancedFilterOpen(true)}
            >
              Advanced Filter
            </Button>
          </Box>
        </Box>
        {filteredPolls.length === 0 ? (
          <Box textAlign="center" my={4}>
            <Typography variant="h6" color="textSecondary">
              No polls found for the selected filters.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={4}>
            {filteredPolls.map((poll) => (
              <Grid item xs={12} sm={6} md={4} key={poll.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {poll.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Status:{" "}
                      <strong>
                        {new Date() < new Date(poll.startDate)
                          ? "Upcoming"
                          : new Date() < new Date(poll.endDate)
                          ? "Active"
                          : "Ended"}
                      </strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Votes: {poll.totalVotes || 0}
                    </Typography>
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={() => handleViewDetailsClick(poll)}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Advanced Filter Modal */}
      <Modal
        open={advancedFilterOpen}
        onClose={() => setAdvancedFilterOpen(false)}
        aria-labelledby="advanced-filter-title"
        aria-describedby="advanced-filter-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography id="advanced-filter-title" variant="h6" gutterBottom>
            Advanced Filters
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel
              sx={{
                backgroundColor: "white",
                px: 0.5,
              }}
            >
              Select College
            </InputLabel>
            <Select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
            >
              {colleges.map((college) => (
                <MenuItem key={college} value={college}>
                  {college}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel
              sx={{
                backgroundColor: "white",
                px: 0.5,
              }}
            >
              Status
            </InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              {statuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel
              sx={{
                backgroundColor: "white",
                px: 0.5,
              }}
            >
              Sort By
            </InputLabel>
            <Select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              {sortOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box display="flex" gap={2} mb={2}>
            <TextField
              label="From"
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <TextField
              label="To"
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </Box>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleApplyFilters}
          >
            Apply
          </Button>
        </Box>
      </Modal>

      {/* Modal for Poll Details */}
      <Modal open={modalOpen} onClose={handleCloseModal}>
        <Paper
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            maxHeight: "90vh", // Limit height to enable scrolling
            overflowY: "auto", // Enable scrolling for overflowing content
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
                {selectedPoll.description} {/* Add poll description */}
              </Typography>
              {selectedPoll.status === "active" || selectedPoll.status === "not started" ? (
                <>
                  <Typography variant="body2" gutterBottom>
                    <strong>Start Date:</strong> {formatDate(new Date(selectedPoll.startDate))}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>End Date:</strong> {formatDate(new Date(selectedPoll.endDate))}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Status:</strong> {selectedPoll.status}
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    Candidates
                  </Typography>
                  <List>
                    {(selectedPoll.candidates ?? []).map((candidate: any, index: number) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={candidate.name}
                          secondary={candidate.description || "No description provided"}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              ) : selectedPoll.status === "ended" ? (
                <>
                  <Typography variant="body2" gutterBottom>
                    <strong>Start Date:</strong> {formatDate(new Date(selectedPoll.startDate))}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>End Date:</strong> {formatDate(new Date(selectedPoll.endDate))}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Total Votes:</strong> {selectedPoll.totalVotes || 0}
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    Results Visualization
                  </Typography>
                  <Box sx={{ height: 300, mt: 0.5 }}> {/* Reduced gap */}
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
                  <Box sx={{ height: 50, mt: 1 }}> {/* Reduced gap */}
                    <ResponsiveContainer width="100%" height="20%">
                      <PieChart>
                        <Pie
                          data={selectedPoll.candidates?.map((candidate, index) => ({
                            name: candidate.name,
                            votes: candidate.votes || 0,
                            percentage:
                              (selectedPoll.totalVotes ?? 0) > 0
                                ? ((candidate.votes || 0) / (selectedPoll.totalVotes ?? 1)) * 100
                                : 0,
                            fill: COLORS[index % COLORS.length],
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
              ) : null}
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
    </Container>
  );
};

export default PollResults;