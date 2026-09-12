// React namespace
import * as React from 'react';
// Material UI Lab: Timeline components
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import TimelineDot from '@mui/lab/TimelineDot';
// Material UI icons for each timeline stage
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
// Material UI Typography for text styling
import Typography from '@mui/material/Typography';

// A static three-stage timeline showing the lifecycle of a report:
// Issue Created → Location Visited → Issue Completed.
export default function CustomTimeline() {
  return (
    // Alternating left/right layout
    <Timeline position="alternate">
      {/* Stage 1: User Created Issue */}
      <TimelineItem>
        <TimelineOppositeContent
          sx={{ m: 'auto 0' }}
          align="right"
          variant="body2"
          color="text.secondary"
        >
          9:00 am
        </TimelineOppositeContent>
        <TimelineSeparator>
          <TimelineConnector />
          {/* Primary-colored dot with a calendar icon */}
          <TimelineDot color="primary">
            <EventAvailableIcon />
          </TimelineDot>
          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent sx={{ py: '12px', px: 2 }}>
          <Typography
            variant="body1"
            component="span"
            sx={{
              fontWeight: 'bold',
            }}
          >
            Issue Created
          </Typography>
          <Typography variant="body2">
            User created the issue and provided the details.
          </Typography>
        </TimelineContent>
      </TimelineItem>

      {/* Stage 2: Visited the Location */}
      <TimelineItem>
        <TimelineOppositeContent
          sx={{ m: 'auto 0' }}
          variant="body2"
          color="text.secondary"
        >
          11:00 am
        </TimelineOppositeContent>
        <TimelineSeparator>
          <TimelineConnector />
          {/* Secondary-colored dot with a location pin icon */}
          <TimelineDot color="secondary">
            <LocationOnIcon />
          </TimelineDot>
          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent sx={{ py: '12px', px: 2 }}>
          <Typography
            variant="body1"
            component="span"
            sx={{
              fontWeight: 'bold',
            }}
          >
            Location Visited
          </Typography>
          <Typography variant="body2">
            The location was visited and inspected for further action.
          </Typography>
        </TimelineContent>
      </TimelineItem>

      {/* Stage 3: Issue Completed */}
      <TimelineItem>
        <TimelineSeparator>
          <TimelineConnector />
          {/* Success-colored dot with a check-circle icon */}
          <TimelineDot color="success">
            <CheckCircleIcon />
          </TimelineDot>
          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent sx={{ py: '12px', px: 2 }}>
          <Typography
            variant="body1"
            component="span"
            sx={{
              fontWeight: 'bold',
            }}
          >
            Issue Completed
          </Typography>
          <Typography variant="body2">
            The issue was resolved and closed.
          </Typography>
        </TimelineContent>
      </TimelineItem>
    </Timeline>
  );
}
