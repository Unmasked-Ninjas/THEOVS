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
  const isActive = new Date() < new Date(poll.endDate);

  const handleViewResults = () => {
    navigate(`/admin/poll/${poll.id}/results`);
  };

  const handleEditPoll = () => {
    navigate(`/admin/poll/${poll.id}/edit`);
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
            label={isActive ? "Active" : "Ended"}
            color={isActive ? "success" : "default"}
            size="small"
          />
        </Box>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {poll.description && poll.description.length > 100
            ? `${poll.description.substring(0, 100)}...`
            : poll.description}
        </Typography>
        <Typography variant="caption" display="block" gutterBottom>
          Ends: {new Date(poll.endDate).toLocaleDateString()}
        </Typography>
        <Typography variant="caption" display="block">
          Votes: {poll.totalVotes || 0}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={handleViewResults}>
          View Results
        </Button>
        {isActive && (
          <Button size="small" onClick={handleEditPoll}>
            Edit
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default PollCard;
