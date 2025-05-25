// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import {
//   Box,
//   Typography,
//   Button,
//   Paper,
//   Container,
//   Grid,
//   Card,
//   CardContent,
//   Avatar,
//   CircularProgress,
//   Chip,
//   Divider,
//   IconButton,
//   useTheme,
//   useMediaQuery
// } from '@mui/material';
// import { Tabs, Tab } from '@mui/material';

// import { 
//   ArrowBack, 
//   Analytics,
//   FormatQuote,
//   Timer,
//   Spellcheck,
//   MenuBook
// } from '@mui/icons-material';
// import { Line } from 'react-chartjs-2';
// import { 
//   Chart as ChartJS, 
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend
// } from 'chart.js';
// import { useUserAuth } from '../context/UserAuthContext';
// import axios from 'axios';
// import picbg from '../../assets/picbg.png';
// import '@fontsource/press-start-2p';

// // Explicitly register all necessary Chart.js components for robustness
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend
// );

// function TabPanel({ children, value, index, ...other }) {
//   return (
//     <div
//       role="tabpanel"
//       hidden={value !== index}
//       id={`trend-tabpanel-${index}`}
//       aria-labelledby={`trend-tab-${index}`}
//       {...other}
//     >
//       {value === index && (
//         <Box sx={{ py: 2 }}>
//           {children}
//         </Box>
//       )}
//     </div>
//   );
// }

// const SessionProgressView = () => {
//   const { getToken } = useUserAuth();
//   const { sessionId } = useParams();
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [progressData, setProgressData] = useState(null);
//   const [activeTab, setActiveTab] = useState(0);
//   const theme = useTheme();
//     const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

//    const pixelText = {
//     fontFamily: '"Press Start 2P", cursive',
//     fontSize: isMobile ? '8px' : '10px',
//     lineHeight: '1.5',
//     letterSpacing: '0.5px'
//   };

//   const pixelHeading = {
//     fontFamily: '"Press Start 2P", cursive',
//     fontSize: isMobile ? '12px' : '14px',
//     lineHeight: '1.5',
//     letterSpacing: '1px'
//   };

//   const pixelButton = {
//     fontFamily: '"Press Start 2P", cursive',
//     fontSize: isMobile ? '8px' : '10px',
//     letterSpacing: '0.5px',
//     textTransform: 'uppercase'
//   };
  
//   const handleTabChange = (event, newValue) => setActiveTab(newValue);

//   useEffect(() => {
//     const fetchProgressData = async () => {
//       try {
//         setLoading(true);
//         const token = await getToken();
//         const response = await axios.get(
//           `http://localhost:8080/api/progress/student/session/${sessionId}`,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//         console.log('Progress data received:', JSON.stringify(response.data, null, 2));
//         setProgressData(response.data);
//         setLoading(false);
//       } catch (err) {
//         setError(err.response?.data?.message || 'Failed to fetch progress data');
//         setLoading(false);
//         console.error('Error fetching progress data:', err);
//       }
//     };

//     fetchProgressData();
//   }, [sessionId, getToken]);

//   const handleBack = () => {
//     navigate(-1);
//   };

//   const trendMetrics = [
//     { key: 'COMPREHENSION', label: 'Comprehension Trend', icon: <MenuBook />, color: '#2196F3' },
//     { key: 'WORD_BOMB_USAGE', label: 'Word Bomb Usage Trend', icon: <FormatQuote />, color: '#FF9800' },
//     { key: 'GRAMMAR_ACCURACY', label: 'Grammar Accuracy Trend', icon: <Spellcheck />, color: '#4CAF50' },
//     { key: 'TURN_COMPLETION', label: 'Turn Completion Trend', icon: <Timer />, color: '#5F4B8B' },
//   ];

//   const metrics = [
//     { key: 'turnCompletionRate', label: 'Turn Completion', icon: <Timer />, color: '#5F4B8B' },
//     { key: 'grammarAccuracy', label: 'Grammar Accuracy', icon: <Spellcheck />, color: '#4CAF50' },
//     { key: 'wordBombUsageRate', label: 'Word Bomb Usage', icon: <FormatQuote />, color: '#FF9800' },
//     { key: 'comprehensionScore', label: 'Comprehension', icon: <MenuBook />, color: '#2196F3' },
//   ];

//   const prepareTrendData = (metricKey, label, color) => {
//     if (
//       !progressData?.progress?.trends?.[metricKey] ||
//       progressData.progress.trends[metricKey].length === 0
//     ) {
//       return null;
//     }

//     const trend = progressData?.progress?.trends?.[metricKey] ?? [];
//     const labels = trend.map(point =>
//       new Date(point.timestamp).toLocaleTimeString([], {
//         hour: '2-digit',
//         minute: '2-digit',
//         second: '2-digit'
//       })
//     );

//     const data = trend.map(point => point.value);

//     return {
//       labels,
//       datasets: [
//         {
//           label: label,
//           data: data,
//           fill: true,
//           borderColor: color,
//           backgroundColor: `${color}33`,
//           tension: 0.3,
//           pointBackgroundColor: color,
//           pointBorderColor: '#fff',
//           pointHoverBackgroundColor: '#fff',
//           pointHoverBorderColor: color,
//         }
//       ]
//     };
//   };

//   const calculateSessionStats = () => {
//     if (!progressData || !progressData.progress) {
//       return {
//         turnCompletionRate: 0,
//         grammarAccuracy: 0,
//         wordBombUsageRate: 0,
//         comprehensionScore: 0,
//         avgResponseTime: 0,
//       };
//     }

//     const progress = progressData.progress;
    
//     return {
//       turnCompletionRate: progress.turnCompletionRate ?? 0,
//       grammarAccuracy: progress.grammarAccuracy ?? 0,
//       wordBombUsageRate: progress.wordBombUsageRate ?? 0,
//       comprehensionScore: progress.comprehensionScore ?? 0,
//       avgResponseTime: progress.avgResponseTime ?? 0,
//     };
//   };

//   const sessionStats = calculateSessionStats();

//   if (loading) {
//     return (
//       <Container maxWidth="lg" sx={{ 
//         display: 'flex', 
//         justifyContent: 'center', 
//         alignItems: 'center', 
//         minHeight: '100vh',
//         background: 'rgba(255,255,255,0.7)',
//         backdropFilter: 'blur(8px)'
//       }}>
//         <CircularProgress size={60} sx={{ color: '#5F4B8B' }} />
//       </Container>
//     );
//   }

//   if (!progressData) {
//     return (
//       <Container maxWidth="lg" sx={{ 
//         py: 4, 
//         textAlign: 'center',
//         background: 'rgba(255,255,255,0.7)',
//         backdropFilter: 'blur(8px)',
//         borderRadius: '12px',
//         mt: 4
//       }}>
//         <Typography variant="h6" sx={{ mb: 2 }}>No progress data available for this session.</Typography>
//         <Button 
//           variant="contained" 
//           onClick={handleBack} 
//           sx={{ 
//             mt: 2,
//             background: 'linear-gradient(135deg, #6c63ff, #5F4B8B)',
//             '&:hover': { background: 'linear-gradient(135deg, #5a52e0, #4a3a6d)' },
//             boxShadow: '0 4px 6px rgba(95, 75, 139, 0.2)'
//           }}
//         >
//           Go Back
//         </Button>
//       </Container>
//     );
//   }

//   return (
//   <Box sx={{ 
//     display: 'flex',
//     flexDirection: 'column',
//     height: '100vh',
//     overflow: 'hidden',
//     background: `
//       linear-gradient(to bottom, 
//         rgba(249, 249, 249, 10) 0%, 
//         rgba(249, 249, 249, 10) 40%, 
//         rgba(249, 249, 249, 0.1) 100%),
//       url(${picbg})`,
//     backgroundSize: 'cover',
//     backgroundPosition: 'center',
//     backgroundRepeat: 'no-repeat',
//     backgroundAttachment: 'fixed',
//     imageRendering: 'pixelated',
//   }}>
//     {/* Header */}
//     <Box sx={{ 
//       backgroundColor: 'white',
//       boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
//       py: 2,
//       px: { xs: 2, md: 6 },
//       zIndex: 1000,
//       position: 'sticky',
//       top: 0
//     }}>
//       <Box display="flex" justifyContent="space-between" alignItems="center">
//         <Box 
//           display="flex" 
//           alignItems="center" 
//           gap={2}
//         >
//           <Analytics sx={{ 
//             color: '#5F4B8B',
//             fontSize: isMobile ? '28px' : '32px'
//           }} />
//           <Typography sx={{ 
//             ...pixelHeading,
//             color: '#5F4B8B',
//             fontSize: isMobile ? '14px' : '16px'
//           }}>
//             Session Progress Report
//           </Typography>
//         </Box>

//         <Button 
//           variant="contained" 
//           onClick={handleBack} 
//           startIcon={<ArrowBack sx={{ fontSize: isMobile ? '16px' : '20px' }} />}
//           sx={{
//             ...pixelText,
//             background: 'linear-gradient(135deg, #6c63ff, #5F4B8B)',
//             color: '#fff',
//             border: 'none',
//             borderRadius: '8px',
//             boxShadow: '0 4px 6px rgba(95, 75, 139, 0.2)',
//             textTransform: 'none',
//             fontSize: isMobile ? '8px' : '10px',
//             fontWeight: 150,
//             height: isMobile ? '32px' : '40px',
//             px: 3,
//             '&:hover': { 
//               background: 'linear-gradient(135deg, #5a52e0, #4a3a6d)',
//               boxShadow: '0 6px 8px rgba(95, 75, 139, 0.3)',
//               transform: 'translateY(-2px)'
//             },
//             '&:active': {
//               transform: 'translateY(0)',
//               boxShadow: '0 2px 4px rgba(95, 75, 139, 0.3)'
//             },
//             transition: 'all 0.2s ease',
//             position: 'relative',
//             overflow: 'hidden',
//             '&::after': {
//               content: '""',
//               position: 'absolute',
//               top: '-50%',
//               left: '-50%',
//               width: '200%',
//               height: '200%',
//               background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent)',
//               transform: 'rotate(45deg)',
//               transition: 'all 0.5s ease'
//             },
//             '&:hover::after': {
//               left: '100%'
//             }
//           }}
//         >
//           Back to Session
//         </Button>
//       </Box>
//     </Box>

//     {/* Scrollable Content */}
//     <Box sx={{ 
//       flex: 1,
//       width: '100%',
//       overflow: 'auto',
//       '&::-webkit-scrollbar': {
//         width: '8px',
//       },
//       '&::-webkit-scrollbar-track': {
//         backgroundColor: 'rgba(95, 75, 139, 0.1)',
//       },
//       '&::-webkit-scrollbar-thumb': {
//         backgroundColor: '#5F4B8B',
//         borderRadius: '4px',
//         '&:hover': {
//           backgroundColor: '#4a3a6d',
//         },
//       },
//     }}>
//       <Container maxWidth="xl" sx={{ py: 4 }}>
//         {/* Metrics Grid */}
//         <Grid container spacing={3} sx={{ mb: 4 }}>
//           {metrics.map((metric, index) => {
//             const value = sessionStats[metric.key];
//             return (
//               <Grid item xs={12} sm={6} md={3} key={index}>
//                 <Card sx={{ 
//                   height: '100%', 
//                   borderRadius: '12px',
//                   background: 'rgba(255,255,255,0.7)',
//                   backdropFilter: 'blur(8px)',
//                   boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
//                   border: '1px solid rgba(255,255,255,0.3)',
//                   '&:hover': {
//                     transform: 'translateY(-4px)',
//                     boxShadow: '0 12px 40px rgba(31, 38, 135, 0.15)'
//                   },
//                   transition: 'all 0.3s ease',
//                   position: 'relative',
//                   overflow: 'hidden',
//                   '&::before': {
//                     content: '""',
//                     position: 'absolute',
//                     top: 0,
//                     left: 0,
//                     right: 0,
//                     height: '6px',
//                     background: metric.color,
//                     opacity: 0.8
//                   }
//                 }}>
//                   <CardContent sx={{ textAlign: 'center', width: '27vh' }}>
//                     <Avatar sx={{ 
//                       bgcolor: metric.color, 
//                       mb: 2, 
//                       mx: 'auto',
//                       width: 56,
//                       height: 56
//                     }}>
//                       {metric.icon}
//                     </Avatar>
//                     <Typography variant="h6" color="text.secondary">
//                       Avg. {metric.label}
//                     </Typography>
//                     <Typography variant="h4" fontWeight="bold" sx={{ color: metric.color }}>
//                       {value.toFixed(1)}%
//                     </Typography>
//                     <Box sx={{ mt: 1 }}>
//                       <Chip 
//                         label={
//                           value > 75 ? 'Excellent' :
//                           value > 50 ? 'Good' : 'Needs Improvement'
//                         }
//                         size="small"
//                         sx={{
//                           backgroundColor: 
//                             value > 75 ? '#4caf50' :
//                             value > 50 ? '#ff9800' : '#f44336',
//                           color: 'white',
//                           fontWeight: 'bold'
//                         }}
//                       />
//                     </Box>
//                   </CardContent>
//                 </Card>
//               </Grid>
//             );
//           })}

//           {/* Avg. Response Time Card */}
//           <Grid item xs={12} sm={6} md={3}>
//             <Card sx={{ 
//               width: '29.6vh',
//               height: '100%', 
//               borderRadius: '12px',
//               background: 'rgba(255,255,255,0.7)',
//               backdropFilter: 'blur(8px)',
//               boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
//               border: '1px solid rgba(255,255,255,0.3)',
//               '&:hover': {
//                 transform: 'translateY(-4px)',
//                 boxShadow: '0 12px 40px rgba(31, 38, 135, 0.15)'
//               },
//               transition: 'all 0.3s ease',
//               position: 'relative',
//               overflow: 'hidden',
//               '&::before': {
//                 content: '""',
//                 position: 'absolute',
//                 top: 0,
//                 left: 0,
//                 right: 0,
//                 height: '6px',
//                 background: '#9C27B0',
//                 opacity: 0.8
//               }
//             }}>
//               <CardContent sx={{ textAlign: 'center' }}>
//                 <Avatar sx={{ 
//                   bgcolor: '#9C27B0', 
//                   mb: 2, 
//                   mx: 'auto',
//                   width: 56,
//                   height: 56
//                 }}>
//                   <Timer />
//                 </Avatar>
//                 <Typography variant="h6" color="text.secondary">
//                   Avg. Response Time
//                 </Typography>
//                 <Typography variant="h4" fontWeight="bold" sx={{ color: '#9C27B0' }}>
//                   {sessionStats.avgResponseTime.toFixed(2)}s
//                 </Typography>
//                 <Box sx={{ mt: 1 }}>
//                   <Chip 
//                     label={
//                       sessionStats.avgResponseTime < 10 ? 'Fast' :
//                       sessionStats.avgResponseTime < 20 ? 'Moderate' : 'Slow'
//                     }
//                     size="small"
//                     sx={{
//                       backgroundColor: 
//                         sessionStats.avgResponseTime < 10 ? '#4caf50' :
//                         sessionStats.avgResponseTime < 20 ? '#ff9800' : '#f44336',
//                       color: 'white',
//                       fontWeight: 'bold'
//                     }}
//                   />
//                 </Box>
//               </CardContent>
//             </Card>
//           </Grid>
//         </Grid>

//         {/* Trend Charts */}
//         <Paper sx={{ 
//           p: 3,
//           borderRadius: '12px',
//           background: 'rgba(255,255,255,0.7)',
//           backdropFilter: 'blur(8px)',
//           boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
//           border: '1px solid rgba(255,255,255,0.3)',
//           mb: 4
//         }}>
//           <Typography sx={{ ...pixelHeading, color: '#5F4B8B', mb: 3 }}>
//             Performance Trends
//           </Typography>
          
//           <Tabs
//             value={activeTab}
//             onChange={handleTabChange}
//             variant="scrollable"
//             scrollButtons="auto"
//             textColor="primary"
//             indicatorColor="primary"
//             sx={{
//               '& .MuiTab-root': {
//                 ...pixelText,
//                 minWidth: 150,
//                 fontWeight: 'bold',
//                 color: '#5F4B8B',
//                 opacity: 0.7,
//                 '&.Mui-selected': {
//                   color: '#5F4B8B',
//                   opacity: 1
//                 }
//               },
//               '& .MuiTabs-indicator': {
//                 backgroundColor: '#5F4B8B'
//               }
//             }}
//           >
//             {trendMetrics.map((trend, index) => (
//               <Tab
//                 key={index}
//                 label={trend.label}
//                 icon={trend.icon}
//                 iconPosition="start"
//                 sx={{
//                   '& .MuiSvgIcon-root': {
//                     fontSize: '20px'
//                   }
//                 }}
//               />
//             ))}
//           </Tabs>

//           {trendMetrics.map((trend, index) => {
//             const trendData = prepareTrendData(trend.key, trend.label, trend.color);
//             return (
//               <TabPanel key={index} value={activeTab} index={index}>
//                 {trendData ? (
//                   <Box sx={{ height: '400px', width: '100%' }}>
//                     <Line
//                       data={trendData}
//                       options={{
//                         responsive: true,
//                         maintainAspectRatio: false,
//                         plugins: {
//                           legend: {
//                             display: true,
//                             position: 'top'
//                           },
//                           tooltip: {
//                             mode: 'index',
//                             intersect: false,
//                           }
//                         },
//                         scales: {
//                           y: {
//                             beginAtZero: true,
//                             max: 100
//                           }
//                         }
//                       }}
//                     />
//                   </Box>
//                 ) : (
//                   <Typography sx={{ 
//                     textAlign: 'center', 
//                     py: 4,
//                     color: 'text.secondary'
//                   }}>
//                     No data available for this trend.
//                   </Typography>
//                 )}
//               </TabPanel>
//             );
//           })}
//         </Paper>
//       </Container>
//     </Box>
//   </Box>
// );
// };

// export default SessionProgressView;