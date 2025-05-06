import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  CircularProgress,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface PollResult {
  id: string;
  title: string;
  totalVotes: number;
  candidates: {
    id: string;
    name: string;
    votes: number;
    percentage: number;
  }[];
  endDate: Date;
  isActive: boolean;
}

const PollResults: React.FC = () => {
  const [results, setResults] = useState<PollResult[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
    "#FF6B6B",
    "#6C8EAD",
  ];

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    try {
      // Get all polls that have ended or are active but showing results
      const pollsRef = collection(db, "polls");
      let pollQuery = query(pollsRef, where("showResults", "==", true));

      const querySnapshot = await getDocs(pollQuery);
      const resultsData: PollResult[] = [];

      for (const pollDoc of querySnapshot.docs) {
        const pollData = pollDoc.data();

        // Get vote counts for each candidate
        const candidatesRef = collection(db, "candidates");
        const candidatesQuery = query(
          candidatesRef,
          where("pollId", "==", pollDoc.id)
        );

        const candidatesSnapshot = await getDocs(candidatesQuery);
        const candidatesData = [];
        let totalVotes = 0;

        for (const candidateDoc of candidatesSnapshot.docs) {
          const candidateData = candidateDoc.data();

          // Count votes for this candidate
          const votesRef = collection(db, "votes");
          const votesQuery = query(
            votesRef,
            where("pollId", "==", pollDoc.id),
            where("candidateId", "==", candidateDoc.id)
          );

          const votesSnapshot = await getDocs(votesQuery);
          const voteCount = votesSnapshot.size;
          totalVotes += voteCount;

          candidatesData.push({
            id: candidateDoc.id,
            name: candidateData.name,
            votes: voteCount,
            percentage: 0, // Will calculate after we have totalVotes
          });
        }

        // Calculate percentages
        candidatesData.forEach((candidate) => {
          candidate.percentage =
            totalVotes > 0
              ? Math.round((candidate.votes / totalVotes) * 100)
              : 0;
        });

        // Sort by votes (highest first)
        candidatesData.sort((a, b) => b.votes - a.votes);

        resultsData.push({
          id: pollDoc.id,
          title: pollData.title,
          totalVotes,
          candidates: candidatesData,
          endDate: pollData.endDate.toDate(),
          isActive: pollData.isActive,
        });
      }

      setResults(resultsData);
      if (resultsData.length > 0) {
        setSelectedPoll(resultsData[0].id);
      }
    } catch (err) {
      console.error("Error fetching results:", err);
      setError("Failed to load poll results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePollChange = (event: any) => {
    setSelectedPoll(event.target.value);
  };

  const getSelectedPollData = () => {
    return results.find((result) => result.id === selectedPoll);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="error">{error}</Typography>
        <Button variant="contained" onClick={fetchResults} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  if (results.length === 0) {
    return (
      <Box sx={{ textAlign: "center", p: 4 }}>
        <Typography variant="h6">No poll results available</Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
          Results will be displayed here once polls end or when administrators
          choose to share them.
        </Typography>
      </Box>
    );
  }

  const selectedPollData = getSelectedPollData();

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Poll Results
      </Typography>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="poll-select-label">Select Poll</InputLabel>
        <Select
          labelId="poll-select-label"
          value={selectedPoll}
          label="Select Poll"
          onChange={handlePollChange}
        >
          {results.map((poll) => (
            <MenuItem key={poll.id} value={poll.id}>
              {poll.title} {poll.isActive ? "(Active)" : "(Ended)"}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedPollData && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title={selectedPollData.title}
                subheader={`Total votes cast: ${selectedPollData.totalVotes}`}
              />
              <Divider />
              <CardContent>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Vote Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={selectedPollData.candidates}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [`${value} votes`, "Votes"]}
                      />
                      <Bar dataKey="votes" fill="#8884d8">
                        {selectedPollData.candidates.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>

                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Percentage Breakdown
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={selectedPollData.candidates}
                        dataKey="votes"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        label={({ name, percentage }) =>
                          `${name}: ${percentage}%`
                        }
                      >
                        {selectedPollData.candidates.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name, props) => [
                          `${props.payload.percentage}%`,
                          props.payload.name,
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default PollResult;