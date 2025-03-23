import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  Chip,
} from "@mui/material";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import { doc } from "firebase/firestore";
import { getDoc } from "firebase/firestore";

interface VoteRecord {
  id: string;
  pollId: string;
  pollTitle: string;
  candidateId: string;
  candidateName: string;
  timestamp: Date;
}

const VotingHistory: React.FC = () => {
  const [voteHistory, setVoteHistory] = useState<VoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchVoteHistory = async () => {
      if (!auth.currentUser) return;

      setLoading(true);
      try {
        const votesRef = collection(db, "votes");
        const voteQuery = query(
          votesRef,
          where("userId", "==", auth.currentUser.uid)
        );

        const querySnapshot = await getDocs(voteQuery);
        const records: VoteRecord[] = [];

        for (const voteDoc of querySnapshot.docs) {
          const voteData = voteDoc.data();

          // Get poll details
          const pollDoc = await getDoc(doc(db, "polls", voteData.pollId));
          const pollData = pollDoc.data();

          // Get candidate details
          const candidateDoc = await getDoc(
            doc(db, "candidates", voteData.candidateId)
          );
          const candidateData = candidateDoc.data();

          records.push({
            id: voteDoc.id,
            pollId: voteData.pollId,
            pollTitle: pollData?.title || "Unknown Poll",
            candidateId: voteData.candidateId,
            candidateName: candidateData?.name || "Unknown Candidate",
            timestamp: voteData.timestamp.toDate(),
          });
        }

        // Sort by most recent first
        records.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setVoteHistory(records);
      } catch (err) {
        console.error("Error fetching vote history:", err);
        setError("Failed to load your voting history. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchVoteHistory();
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
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
      </Box>
    );
  }

  if (voteHistory.length === 0) {
    return (
      <Box sx={{ textAlign: "center", p: 4 }}>
        <Typography variant="h6">
          You haven't voted in any polls yet.
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
          Cast your first vote by visiting the Available Polls tab.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Your Voting History
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Poll</TableCell>
              <TableCell>Vote Cast For</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {voteHistory.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.pollTitle}</TableCell>
                <TableCell>{record.candidateName}</TableCell>
                <TableCell>{formatDate(record.timestamp)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
export default VotingHistory;
