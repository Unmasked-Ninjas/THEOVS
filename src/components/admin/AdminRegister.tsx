import React from "react";
import {
  Box,
  Typography,
  Container,
  Alert,
  Button,
  Card,
  CardContent,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const AdminRegister: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box my={8} display="flex" flexDirection="column" alignItems="center">
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Access Restricted
        </Typography>

        <Card sx={{ width: "100%", mt: 3 }}>
          <CardContent>
            <Alert severity="info" sx={{ mb: 3 }}>
              Admin registration is not available. Admin accounts are created by
              the system developer only.
            </Alert>

            <Box textAlign="center" mt={3}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate("/admin/login")}
              >
                Go to Admin Login
              </Button>
            </Box>

            <Box textAlign="center" mt={2}>
              <Button variant="outlined" onClick={() => navigate("/")}>
                Back to Home
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default AdminRegister;
