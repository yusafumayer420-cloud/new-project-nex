import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Avatar,
} from "@mui/material";
import {
  Refresh,
  Save,
  Timeline,
} from "@mui/icons-material";
import { toast } from "react-hot-toast";
import api from "../api";

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    marketCap: '$2.4T',
    volume24h: '$64B',
    btcDominance: '51.2%',
    ecrPrice: '0.10'
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/settings');
      if (response.data) {
        setSettings(prev => ({
          ...prev,
          marketCap: response.data.marketCap || '$2.4T',
          volume24h: response.data.volume24h || '$64B',
          btcDominance: response.data.btcDominance || '51.2%',
          ecrPrice: response.data.ecrPrice || 0.10
        }));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error("Failed to fetch market settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await api.put('/api/admin/settings', {
        marketCap: settings.marketCap,
        volume24h: settings.volume24h,
        btcDominance: settings.btcDominance,
        ecrPrice: parseFloat(settings.ecrPrice)
      });
      toast.success("Market settings saved successfully");
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error("Failed to save market settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const SettingSection = ({ title, icon, children }) => (
    <Card className="admin-card" sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Avatar sx={{ bgcolor: "rgba(0, 211, 149, 0.1)", color: "#3B82F6" }}>
            {icon}
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            {title}
          </Typography>
        </Box>
        {children}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
            System Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure platform settings and preferences
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchSettings}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveSettings}
            disabled={loading}
          >
            Save Changes
          </Button>
        </Box>
      </Box>

      {/* Settings Content */}
      <Box>
        <SettingSection title="Market Display Settings" icon={<Timeline />}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Total Market Cap
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={settings.marketCap}
                  onChange={(e) => handleSettingChange("marketCap", e.target.value)}
                  placeholder="$2.4T"
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  24h Volume
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={settings.volume24h}
                  onChange={(e) => handleSettingChange("volume24h", e.target.value)}
                  placeholder="$64B"
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  BTC Dominance
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={settings.btcDominance}
                  onChange={(e) => handleSettingChange("btcDominance", e.target.value)}
                  placeholder="51.2%"
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  ECR Coin Price ($)
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  inputProps={{ step: "0.0001" }}
                  value={settings.ecrPrice}
                  onChange={(e) => handleSettingChange("ecrPrice", e.target.value)}
                  placeholder="0.10"
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Save />}
                  onClick={handleSaveSettings}
                  disabled={loading}
                  sx={{ mt: 1 }}
                >
                  Save Market Stats
                </Button>
              </Box>
            </Grid>
          </Grid>
        </SettingSection>
      </Box>
    </Box>
  );
};

export default SystemSettings;
