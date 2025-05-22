import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Container,
  Grid,
  Card,
  CardContent,
  Avatar,
  CircularProgress,
  Chip
} from '@mui/material';
import { Tabs, Tab } from '@mui/material';

import { 
  ArrowBack, 
  School,
  FormatQuote,
  Timer,
  Spellcheck,
  MenuBook
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useUserAuth } from '../context/UserAuthContext';
import axios from 'axios';

// Explicitly register all necessary Chart.js components for robustness
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`trend-tabpanel-${index}`}
      aria-labelledby={`trend-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}
const SessionProgressView = () => {
  const { getToken } = useUserAuth();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progressData, setProgressData] = useState(null); // Initialize as null to clearly distinguish no data vs empty array
const [activeTab, setActiveTab] = useState(0);
const handleTabChange = (event, newValue) => setActiveTab(newValue);
  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const response = await axios.get(
          `http://localhost:8080/api/progress/student/session/${sessionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Progress data received:', JSON.stringify(response.data, null, 2)); // Detailed log

        // The JSON data you provided has 'trends' directly, not inside 'progress'
        // Let's ensure 'progress' and 'trends' are correctly handled.
        // Assuming your backend response is directly the JSON you provided:
        setProgressData(response.data); // Set the entire received object as progressData

        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch progress data');
        setLoading(false);
        console.error('Error fetching progress data:', err);
      }
    };

    fetchProgressData();
  }, [sessionId, getToken]);

  const handleBack = () => {
    navigate(-1);
  };

  const trendMetrics = [
  { key: 'COMPREHENSION', label: 'Comprehension Trend', icon: <MenuBook />, color: '#2196F3' },
  { key: 'WORD_BOMB_USAGE', label: 'Word Bomb Usage Trend', icon: <FormatQuote />, color: '#FF9800' },
  { key: 'GRAMMAR_ACCURACY', label: 'Grammar Accuracy Trend', icon: <Spellcheck />, color: '#4CAF50' },
  { key: 'TURN_COMPLETION', label: 'Turn Completion Trend', icon: <Timer />, color: '#5F4B8B' },
];

  const metrics = [
    { key: 'turnCompletionRate', label: 'Turn Completion', icon: <Timer />, color: '#5F4B8B' },
    { key: 'grammarAccuracy', label: 'Grammar Accuracy', icon: <Spellcheck />, color: '#4CAF50' },
    { key: 'wordBombUsageRate', label: 'Word Bomb Usage', icon: <FormatQuote />, color: '#FF9800' },
    { key: 'comprehensionScore', label: 'Comprehension', icon: <MenuBook />, color: '#2196F3' },
  ];

  // Prepare data for the Comprehension Trend Line chart
  const prepareTrendData = (metricKey, label, color) => {
  if (
    !progressData?.progress?.trends?.[metricKey] ||
    progressData.progress.trends[metricKey].length === 0
  ) {
    return null;
  }

const trend = progressData?.progress?.trends?.[metricKey] ?? [];

  const labels = trend.map(point =>
    new Date(point.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  );

  const data = trend.map(point => point.value);

  return {
    labels,
    datasets: [
      {
        label: label,
        data: data,
        fill: true,
        borderColor: color,
        backgroundColor: `${color}33`, // light transparent version
        tension: 0.3,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: color,
      }
    ]
  };
};



  // Calculate session stats for overview cards
  const calculateSessionStats = () => {
    if (!progressData || !progressData.progress) {
      return {
        turnCompletionRate: 0,
        grammarAccuracy: 0,
        wordBombUsageRate: 0,
        comprehensionScore: 0,
        avgResponseTime: 0,
      };
    }

    const progress = progressData.progress;
    
    return {
      turnCompletionRate: progress.turnCompletionRate ?? 0,
      grammarAccuracy: progress.grammarAccuracy ?? 0,
      wordBombUsageRate: progress.wordBombUsageRate ?? 0,
      comprehensionScore: progress.comprehensionScore ?? 0,
      avgResponseTime: progress.avgResponseTime ?? 0,
    };
  };
  const sessionStats = calculateSessionStats();

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} sx={{ color: '#5F4B8B' }} />
        <Typography variant="h6" mt={2}>Loading student progress...</Typography>
      </Container>
    );
  }

  // Changed from progressData.length === 0 to !progressData
  if (!progressData) { 
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h6">No progress data available for this session.</Typography>
        <Button variant="contained" onClick={handleBack} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Container>
    );
  }

  // --- Rendering the Component --
return (
  <Box sx={{ minHeight: '100%',width:'100%',  overflowY: 'auto',display: 'flex', flexDirection: 'column' }}>
    <Container maxWidth="xl" sx={{ py: 4, flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="bold" color="#5F4B8B">
          <School sx={{ verticalAlign: 'middle', mr: 1 }} />
          Session Progress Report
        </Typography>
        <Button variant="contained" onClick={handleBack} startIcon={<ArrowBack />}>
          Back to Session
        </Button>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((metric, index) => {
          const value = sessionStats[metric.key];
          return (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%', borderRadius: '12px' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ bgcolor: metric.color, mb: 2, mx: 'auto' }}>
                    {metric.icon}
                  </Avatar>
                  <Typography variant="h6" color="text.secondary">
                    Avg. {metric.label}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: metric.color }}>
                    {value.toFixed(1)}%
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip 
                      label={
                        value > 75 ? 'Excellent' :
                        value > 50 ? 'Good' : 'Needs Improvement'
                      }
                      size="small"
                      color={
                        value > 75 ? 'success' :
                        value > 50 ? 'warning' : 'error'
                      }
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}

        {/* Avg. Response Time Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderRadius: '12px' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: '#9C27B0', mb: 2, mx: 'auto' }}>
                <Timer />
              </Avatar>
              <Typography variant="h6" color="text.secondary">
                Avg. Response Time
              </Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#9C27B0' }}>
                {sessionStats.avgResponseTime.toFixed(2)}s
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip 
                  label={
                    sessionStats.avgResponseTime < 10 ? 'Fast' :
                    sessionStats.avgResponseTime < 20 ? 'Moderate' : 'Slow'
                  }
                  size="small"
                  color={
                    sessionStats.avgResponseTime < 10 ? 'success' :
                    sessionStats.avgResponseTime < 20 ? 'warning' : 'error'
                  }
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Trend Charts */}
     <Paper sx={{ p: 2, borderRadius: '12px' }}>
  <Tabs
    value={activeTab}
    onChange={handleTabChange}
    variant="scrollable"
    scrollButtons="auto"
    textColor="primary"
    indicatorColor="primary"
    aria-label="Trend Tabs"
  >
    {trendMetrics.map((trend, index) => (
      <Tab
        key={index}
        label={trend.label}
        icon={trend.icon}
        iconPosition="start"
        sx={{ minWidth: 150 }}
      />
    ))}
  </Tabs>

  {trendMetrics.map((trend, index) => {
    const trendData = prepareTrendData(trend.key, trend.label, trend.color);
    return (
      <TabPanel key={index} value={activeTab} index={index}>
        {trendData ? (
          <Box sx={{ height: '30%',  width: '80%' }}>
            <Line
              data={trendData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: true,
                    position: 'top'
                  },
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </Box>
        ) : (
          <Typography>No data available for this trend.</Typography>
        )}
      </TabPanel>
    );
  })}
</Paper>

    </Container>
  </Box>
);

};

export default SessionProgressView;