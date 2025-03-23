import React from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 8 }}>
        <Typography variant="h2" component="h1" align="center" gutterBottom>
          Online Voting Platform
        </Typography>
        <Typography variant="h5" align="center" color="textSecondary" paragraph>
          A secure and easy way to participate in polls and elections
        </Typography>

        <Paper sx={{ my: 6, py: 6, px: 4, backgroundColor: "#f8f9fa" }}>
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} md={5}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: "center", pt: 4 }}>
                  <HowToVoteIcon
                    sx={{ fontSize: 60, color: "primary.main", mb: 2 }}
                  />
                  <Typography gutterBottom variant="h4" component="h2">
                    Voters
                  </Typography>
                  <Typography variant="body1" color="textSecondary" paragraph>
                    Cast your vote securely in active polls and elections. View
                    results and track your voting history.
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: "center", pb: 3 }}>
                  <Button
                    size="large"
                    variant="contained"
                    color="primary"
                    onClick={() => navigate("/voter/login")}
                  >
                    Voter Login
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            <Grid item xs={12} md={5}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: "center", pt: 4 }}>
                  <AdminPanelSettingsIcon
                    sx={{ fontSize: 60, color: "secondary.main", mb: 2 }}
                  />
                  <Typography gutterBottom variant="h4" component="h2">
                    Administrators
                  </Typography>
                  <Typography variant="body1" color="textSecondary" paragraph>
                    Create and manage polls, view detailed analytics, and ensure
                    the integrity of the voting process.
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: "center", pb: 3 }}>
                  <Button
                    size="large"
                    variant="contained"
                    color="secondary"
                    onClick={() => navigate("/admin/login")}
                  >
                    Admin Login
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ textAlign: "center", mt: 6 }}>
          <Typography variant="h6" gutterBottom>
            Features
          </Typography>
          <Grid container spacing={3} justifyContent="center" sx={{ mt: 2 }}>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle1" gutterBottom>
                Secure Authentication
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Two-factor authentication and encrypted data storage
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle1" gutterBottom>
                Real-time Results
              </Typography>
              <Typography variant="body2" color="textSecondary">
                View election results with interactive charts and graphs
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle1" gutterBottom>
                One Vote Policy
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Ensures each user can only vote once per election
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default LandingPage;
