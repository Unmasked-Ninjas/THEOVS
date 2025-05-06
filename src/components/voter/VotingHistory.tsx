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
} from "@mui/material";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  DocumentReference,
} from "firebase/firestore";
import { auth, db } from "../../firebase/config";

interface VoteData {
  pollId: string | DocumentReference | number;
  candidateId: string | DocumentReference | number;
  timestamp: { toDate(): Date };
}

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
      if (!auth.currentUser) {
        setError("You must be signed in to view your voting history.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const votesRef = collection(db, "votes");
        const voteQuery = query(
          votesRef,
          where("userId", "==", auth.currentUser.uid)
        );
        const snapshot = await getDocs(voteQuery);
        const records: VoteRecord[] = [];

        for (const voteDoc of snapshot.docs) {
          const data = voteDoc.data() as VoteData;

          // Determine poll reference (handle string, number, or DocumentReference)
          let pollRef: DocumentReference;
          if (
            typeof data.pollId === "string" ||
            typeof data.pollId === "number"
          ) {
            pollRef = doc(db, "polls", String(data.pollId));
          } else {
            pollRef = data.pollId;
          }

          // Determine candidate reference
          let candidateRef: DocumentReference;
          if (
            typeof data.candidateId === "string" ||
            typeof data.candidateId === "number"
          ) {
            candidateRef = doc(db, "candidates", String(data.candidateId));
          } else {
            candidateRef = data.candidateId;
          }

          // Fetch poll and candidate details in parallel
          const [pollSnap, candidateSnap] = await Promise.all([
            getDoc(pollRef),
            getDoc(candidateRef),
          ]);
          const pollData = pollSnap.data();
          const candidateData = candidateSnap.data();

          records.push({
            id: voteDoc.id,
            pollId: pollRef.id,
            pollTitle: pollData?.title ?? "Unknown Poll",
            candidateId: candidateRef.id,
            candidateName: candidateData?.name ?? "Unknown Candidate",
            timestamp: data.timestamp.toDate(),
          });
          console.log("Polldata", pollData);
          console.log("Candidatedata", candidateData);
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

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);

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
              {/* <TableCell>Vote Cast For</TableCell> */}
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {voteHistory.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.pollTitle}</TableCell>
                {/* <TableCell>{record.candidateName}</TableCell> */}
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