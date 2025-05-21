import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  CircularProgress,
  Button,
  Divider,
  Grid,
} from "@mui/material";
import { useSearchParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Poll } from "../../types/Poll";
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

const VoterPollResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const pollId = searchParams.get("pollId") || "";
  const navigate = useNavigate();

  console.log("Poll ID:", pollId);

  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");

  useEffect(() => {
    let timer: NodeJS.Timeout;

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

        setPoll({ id: pollDoc.id, ...pollDoc.data() } as Poll);
      } catch (err) {
        console.error("Error fetching poll data:", err);
        setError("Failed to load poll results");
      } finally {
        setLoading(false);
      }
    };

    // Delay fetch by 500ms
    timer = setTimeout(() => {
      fetchPollData();
    }, 500);

    // Cleanup if pollId changes or component unmounts
    return () => clearTimeout(timer);
  }, [pollId]);

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

  // Only allow viewing results if poll has ended or if status isn't "active"
  if (error || !poll) {
    return (
      <Container maxWidth="md">
        <Box my={4} textAlign="center">
          <Typography variant="h5" color="error" gutterBottom>
            {error || "Something went wrong"}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/voter")}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Container>
    );
  }

  // Allow viewing results if the poll's status is not active (ended)
  // or if the current date is past the poll's end date
  if (poll.status !== "ended" && new Date() < new Date(poll.endDate)) {
    return (
      <Container maxWidth="md">
        <Box my={4} textAlign="center">
          <Typography variant="h5" color="Black" gutterBottom>
            Please select a poll to view its results{" "}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/voter")}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Container>
    );
  }

  // build data for charts
  const resultsData = poll.candidates.map((candidate, index) => {
    const voteCount = candidate.votes || 0;
    const percentage =
      poll.totalVotes > 0
        ? ((voteCount / poll.totalVotes) * 100).toFixed(1)
        : "0";

    return {
      name: candidate.name,
      votes: voteCount,
      percentage: parseFloat(percentage),
      fill: COLORS[index % COLORS.length],
    };
  });

  resultsData.sort((a, b) => b.votes - a.votes);

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            Poll Results
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate("/admin/dashboard")}
          >
            Back to Dashboard
          </Button>
        </Box>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              {poll.title}
            </Typography>
            <Typography variant="body1" paragraph>
              {poll.description}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="textSecondary">
                  Total Votes: <strong>{poll.totalVotes || 0}</strong>
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="textSecondary">
                  Status:{" "}
                  <strong>
                    {new Date() < new Date(poll.endDate) ? "Active" : "Ended"}
                  </strong>
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="textSecondary">
                  End Date:{" "}
                  <strong>{new Date(poll.endDate).toLocaleDateString()}</strong>
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={3}
            >
              <Typography variant="h6">Results Visualization</Typography>
              <Box>
                <Button
                  variant={chartType === "bar" ? "contained" : "outlined"}
                  onClick={() => setChartType("bar")}
                  sx={{ mr: 1 }}
                >
                  Bar Chart
                </Button>
                <Button
                  variant={chartType === "pie" ? "contained" : "outlined"}
                  onClick={() => setChartType("pie")}
                >
                  Pie Chart
                </Button>
              </Box>
            </Box>

            {poll.totalVotes === 0 ? (
              <Typography variant="body1" align="center" sx={{ my: 4 }}>
                No votes have been cast yet.
              </Typography>
            ) : (
              <Box sx={{ height: 400 }}>
                {chartType === "bar" ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={resultsData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name) => [
                          `${value} votes (${
                            resultsData.find((d) => d.votes === value)
                              ?.percentage
                          }%)`,
                          name,
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="votes" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={resultsData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={120}
                        dataKey="votes"
                        nameKey="name"
                        label={({ name, percentage }) =>
                          `${name}: ${percentage}%`
                        }
                      >
                        {resultsData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => [`${val} votes`, "Votes"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Box>
            )}

            <Box mt={4}>
              <Typography variant="h6" gutterBottom>
                Vote Distribution
              </Typography>
              <Grid container spacing={2}>
                {resultsData.map((result, idx) => (
                  <Grid item xs={12} sm={6} md={4} key={idx}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          {result.name}
                        </Typography>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">
                            Votes: {result.votes}
                          </Typography>
                          <Typography variant="body2">
                            {result.percentage}%
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default VoterPollResults;
