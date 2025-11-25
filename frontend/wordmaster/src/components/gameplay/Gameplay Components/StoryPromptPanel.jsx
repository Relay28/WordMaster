import React, { useState, useRef, useLayoutEffect } from 'react';
import { Paper, Box, Typography, Chip, IconButton, Collapse } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import { sanitizePlainText } from '../../../utils/sanitize';

const StoryPromptPanel = ({ storyPrompt, gameState, isSinglePlayer, pixelHeading }) => {
  const [open, setOpen] = useState(false);
  const headerHeight = 48;
  const arrowOverlap = 0; // No overlap
  const overlayRef = useRef(null);
  const headerRef = useRef(null);
  const buttonHeight = 36;
  const [arrowTopPx, setArrowTopPx] = useState(null);
  const [arrowLeftPx, setArrowLeftPx] = useState(null);
  const [headerLeftPx, setHeaderLeftPx] = useState(null);
  const [headerWidthPx, setHeaderWidthPx] = useState(null);
  const [headerTopPx, setHeaderTopPx] = useState(null);
  const [overlayTopPx, setOverlayTopPx] = useState(null);

  useLayoutEffect(() => {
    const el = overlayRef.current;
    const headerEl = headerRef.current;
    
    if (headerEl && headerEl.offsetParent) {
      const left = headerEl.offsetLeft || 0;
      const top = headerEl.offsetTop || 0;
      const heightMeasured = headerEl.offsetHeight || Math.round(headerEl.getBoundingClientRect().height || 0);
      const width = headerEl.offsetWidth || headerEl.getBoundingClientRect().width || 0;
      
      setHeaderLeftPx(Math.round(left));
      setHeaderTopPx(Math.round(top));
      setHeaderWidthPx(Math.round(width));
      
      const arrowLeft = Math.round(left + width / 2 - (buttonHeight / 2));
      setArrowLeftPx(arrowLeft);
      
      // No overlap - overlay starts right below header
      setOverlayTopPx(Math.round(top + heightMeasured));
    }

    if (!open) {
      if (headerTopPx !== null && headerWidthPx !== null) {
        const closedTop = headerTopPx + (headerEl ? (headerEl.offsetHeight || headerEl.getBoundingClientRect().height) : headerHeight) - (buttonHeight / 2);
        setArrowTopPx(Math.round(closedTop));
      } else {
        setArrowTopPx(null);
      }
      return;
    }

    if (!el) return;

    const overlayTop = overlayTopPx !== null ? overlayTopPx : (headerEl ? (headerEl.offsetTop + (headerEl.offsetHeight || headerHeight)) : headerHeight);
    const overlayHeight = el.offsetHeight || el.getBoundingClientRect().height || 0;
    
    // Arrow positioned at bottom of overlay with no overlap
    const desired = overlayTop + overlayHeight - (buttonHeight / 2) - 23;
    setArrowTopPx(Math.round(desired));

    const onResize = () => {
      const h = el.offsetHeight || el.getBoundingClientRect().height || 0;
      setArrowTopPx(Math.round(overlayTop + h - (buttonHeight / 2)));
      if (headerEl && headerEl.offsetParent) {
        const left = headerEl.offsetLeft || 0;
        const width = headerEl.offsetWidth || headerEl.getBoundingClientRect().width || 0;
        setHeaderLeftPx(Math.round(left));
        setHeaderWidthPx(Math.round(width));
        setArrowLeftPx(Math.round(left + width / 2 - (buttonHeight / 2)));
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open, storyPrompt]);

  return (
    <Box sx={{ 
      width: '100%', 
      position: 'sticky', 
      top: 0, 
      zIndex: 2000, 
      mt: 0, 
      pt: 0, 
      left: 0, 
      right: 0,
      // Add bottom margin when opened to push content down
      mb: open ? 4 : 0 
    }}>
      <Box sx={{ position: 'relative' }}>
        {/* Header bar: title left */}
        <Paper
          ref={headerRef}
          elevation={0}
          sx={{
            width: '98.5%', 
            height: `50px`,
            borderRadius: '0 0 12px 12px',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,243,250,0.95))',
            border: '2px solid rgba(95,75,139,0.12)',
            mt: 0,
            mb: open ? 0 : 3, // Remove bottom margin when open since we're using container margin
            p: 1,
            boxShadow: open ? '0 10px 30px rgba(95,75,139,0.12)' : '0 4px 10px rgba(31,41,55,0.06)',
            backdropFilter: 'blur(4px)',
            overflow: 'visible',
            cursor: 'default'
          }}
          onClick={() => setOpen((s) => !s)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', height: headerHeight, px: 2 }}>
            <Typography sx={{ ...pixelHeading, color: '#5F4B8B' }}>Story Prompt</Typography>
          </Box>
        </Paper>

        {/* Centered arrow control - positioned with no overlap */}
        <Box sx={{ 
          position: 'absolute', 
          left: arrowLeftPx !== null ? `${arrowLeftPx}px` : '50%', 
          transform: arrowLeftPx !== null ? 'none' : 'translateX(-50%)', 
          top: arrowTopPx !== null ? `${arrowTopPx}px` : `calc(${headerHeight}px - ${buttonHeight / 2}px)`, 
          zIndex: 2200, 
          transition: 'top 260ms ease, left 120ms ease' 
        }}>
          <IconButton
            aria-label={open ? 'Collapse story prompt' : 'Expand story prompt'}
            onClick={(e) => { e.stopPropagation(); setOpen((s) => !s); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setOpen((s) => !s); } }}
            sx={{
              width: 52,
              height: 36,
              borderRadius: 3,
              color: 'inherit',
              p: 0,
              mt: 0,
              bgcolor: '#ffffff',
              border: '2px solid rgba(95,75,139,0.95)',
              boxShadow: open ? '0 6px 18px rgba(95,75,139,0.12)' : '0 3px 10px rgba(95,75,139,0.06)',
              transition: 'border-color 120ms ease, box-shadow 120ms ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': {
      bgcolor: '#e7dde7ff', // ← Keep same background on hover
      opacity: 0.9, // ← Keep same opacity on hover
    },

              '& .MuiSvgIcon-root': {
                fontSize: 20,
                color: 'rgba(95,75,139,1)'
              },
            }}
            size="small"
          >
            {open ? <KeyboardDoubleArrowUpIcon sx={{ color: 'rgba(95,75,139,1)' }} fontSize="small" /> : <KeyboardDoubleArrowDownIcon sx={{ color: 'rgba(95,75,139,1)' }} fontSize="small" />}
          </IconButton>
        </Box>

        {/* Expanded overlay content - positioned with no overlap */}
        <Collapse in={open} timeout={300} unmountOnExit>
          <Box ref={overlayRef} sx={{ 
            position: 'absolute', 
            top: `${headerHeight}px`, // No overlap - starts right below header
            left: headerLeftPx !== null ? `${headerLeftPx}px` : 0, 
            width: headerWidthPx !== null ? `${headerWidthPx}px` : '100%', 
            zIndex: 2100 
          }}>
            <Paper
              sx={{
                width: '99%', 
                p: 1,
                borderRadius: '0 0 12px 12px',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,243,250,0.96))',
                boxShadow: '0 14px 40px rgba(31, 41, 55, 0.15)',
                border: '2px solid rgba(95,75,139,0.12)',
                backdropFilter: 'blur(6px)',
                overflow: 'hidden'
              }}
            >
              <Box sx={{ p: { xs: 1.25, sm: 2 }, maxHeight: { xs: 220, sm: 420 }, overflowY: 'auto' }}>
                <Typography sx={{ whiteSpace: 'pre-wrap', fontSize: { xs: '0.95rem', sm: '1.15rem' }, lineHeight: 1.6 }}>
                  {sanitizePlainText(storyPrompt)}
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
};

export default StoryPromptPanel;