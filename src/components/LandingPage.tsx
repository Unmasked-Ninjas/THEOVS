import React from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Card,
  CardContent,
  CardActions,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 8, textAlign: "center" }}>
        <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom>
          The OVS
        </Typography>
        <Typography variant="h5" color="textSecondary" sx={{ mb: 6 }}>
          Vote without fear
        </Typography>

        <Paper
          elevation={2}
          sx={{
            py: 6,
            px: 4,
            backgroundColor: "#f8f9fa",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <Box sx={{ mb: 4, textAlign: "center" }}>
            <HowToVoteIcon
              sx={{ fontSize: 70, color: "primary.main", mb: 2 }}
            />
            <Typography variant="h4" component="h2" gutterBottom>
              Online Voting System
            </Typography>
            <Typography variant="body1" color="textSecondary">
              A secure and easy way to participate in polls and elections
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Card
            sx={{
              maxWidth: 450,
              mx: "auto",
              boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ textAlign: "center", pt: 4 }}>
              <Typography gutterBottom variant="h5" component="h3">
                Voter Access
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Cast your vote securely in active polls and elections. View
                results and track your voting history.
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: "center", pb: 3, gap: 2 }}>
              <Button
                size="large"
                variant="contained"
                color="primary"
                onClick={() => navigate("/voter/login")}
              >
                Login
              </Button>
            </CardActions>
          </Card>
        </Paper>

        <Box sx={{ mt: 6 }}>
          <Typography variant="h6" gutterBottom>
            Key Features
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              justifyContent: "space-between",
              mt: 3,
              gap: 4,
            }}
          >
            <Box>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Secure Authentication
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Two-factor authentication and encrypted data storage
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Real-time Results
              </Typography>
              <Typography variant="body2" color="textSecondary">
                View election results with interactive charts and graphs
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                One Vote Policy
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Ensures each user can only vote once per election
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default LandingPage;
