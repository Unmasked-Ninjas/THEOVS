import React from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import { Poll } from "../../types/Poll";

interface PollCardProps {
  poll: Poll;
  onDelete: (pollId: string) => Promise<void>;
}

const PollCard: React.FC<PollCardProps> = ({ poll, onDelete }) => {
  const navigate = useNavigate();
  const isActive = new Date() < new Date(poll.endDate);

  const handleViewResults = () => {
    navigate(`/admin/poll/${poll.id}/results`);
  };

  const handleEditPoll = () => {
    navigate(`/admin/poll/${poll.id}/edit`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      window.confirm(
        "Are you sure you want to delete this poll? This action cannot be undone."
      )
    ) {
      await onDelete(poll.id);
    }
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
          <Box display="flex" alignItems="center">
            <IconButton
              aria-label="delete"
              color="error"
              size="small"
              onClick={handleDelete}
              sx={{ mr: 1 }}
            >
              <DeleteIcon />
            </IconButton>
            <Chip
              label={isActive ? "Active" : "Ended"}
              color={isActive ? "success" : "default"}
              size="small"
            />
          </Box>
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
