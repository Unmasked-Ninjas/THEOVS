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
          try {
            const data = voteDoc.data() as VoteData;
            console.log("Vote data:", data); // Debug log

            // Get poll information
            let pollId = "";
            if (typeof data.pollId === "string") {
              pollId = data.pollId;
            } else if (typeof data.pollId === "object" && data.pollId.id) {
              // It's a DocumentReference
              pollId = data.pollId.id;
            }

            if (!pollId) {
              console.error("Invalid poll ID:", data.pollId);
              continue;
            }

            const pollRef = doc(db, "polls", pollId);
            const pollSnap = await getDoc(pollRef);

            if (!pollSnap.exists()) {
              console.log("Poll not found:", pollId);
              continue;
            }

            const pollData = pollSnap.data();

            // Find candidate info directly from the poll data
            const candidate = pollData.candidates?.find(
              (c: any) =>
                c.id === data.candidateId ||
                (typeof data.candidateId === "object" &&
                  data.candidateId.id === c.id)
            );

            const candidateName = candidate?.name || "Unknown Candidate";

            records.push({
              id: voteDoc.id,
              pollId: pollId,
              pollTitle: pollData?.title ?? "Unknown Poll",
              candidateId:
                typeof data.candidateId === "string"
                  ? data.candidateId
                  : (data.candidateId as DocumentReference)?.id || "unknown",
              candidateName,
              timestamp: data.timestamp.toDate(),
            });
          } catch (err) {
            console.error("Error processing vote document:", err);
            // Continue with next vote record instead of failing completely
          }
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
