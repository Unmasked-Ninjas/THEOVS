import React from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Poll } from "../../types/Poll";

interface PollCardProps {
  poll: Poll;
}


const PollCard: React.FC<PollCardProps> = ({ poll }) => {
  const navigate = useNavigate();

  const handleViewResults = () => {
    navigate(`/admin/poll/${poll.id}/results`);
  };

  const handleEditPoll = () => {
    navigate(`/admin/poll/${poll.id}/edit`);
  };

  const formatDateTime = (date: string | Date) => {
    const formattedDate = new Date(date).toLocaleDateString();
    const formattedTime = new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${formattedDate} ${formattedTime}`;
  };

  return (
    <Card elevation={3}>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Typography variant="h6" component="h2" gutterBottom>
            {poll.title}
          </Typography>
          <Chip
            label={poll.status} // Directly display the status from the database
            color={
              poll.status === "active"
                ? "success"
                : poll.status === "not started"
                ? "info"
                : "error" // Red background for "ended" polls
            }
            size="small"
          />
        </Box>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {poll.description && poll.description.length > 100
            ? `${poll.description.substring(0, 100)}...`
            : poll.description}
        </Typography>
        {poll.status === "ended" ? ( // Show "Started" and "Ended" for "ended" polls
          <>
            <Typography variant="caption" display="block" gutterBottom>
              Started: {formatDateTime(poll.startDate)}
            </Typography>
            <Typography variant="caption" display="block" gutterBottom>
              Ended: {formatDateTime(poll.endDate)}
            </Typography>
          </>
        ) : poll.status === "active" ? ( // Show "Started" and "Ends" for "active" polls
          <>
            <Typography variant="caption" display="block" gutterBottom>
              Started: {formatDateTime(poll.startDate)}
            </Typography>
            <Typography variant="caption" display="block" gutterBottom>
              Ends: {formatDateTime(poll.endDate)}
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="caption" display="block" gutterBottom>
              Starts: {formatDateTime(poll.startDate)}
            </Typography>
            <Typography variant="caption" display="block" gutterBottom>
              Ends: {formatDateTime(poll.endDate)}
            </Typography>
          </>
        )}
        <Typography variant="caption" display="block">
          Votes: {poll.totalVotes || 0}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={handleViewResults}>
          View Results
        </Button>
        {poll.status === "not started" && ( // Only allow editing if the poll is "not started"
          <Button size="small" onClick={handleEditPoll}>
            Edit
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default PollCard;