// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
require('dotenv').config(); // Load environment variables

// Initialize Express application
const app = express();
app.use(bodyParser.json());

// Retrieve Zoom Webhook Secret Token from environment variables
const ZOOM_WEBHOOK_SECRET_TOKEN = "your-secret-token";

// Map to store active meetings (UUID to meeting ID mapping)
const meetingMap = new Map();

// Main event processing function
function processEvent(event) {
    const eventType = event.event;
    const payload = event.payload;

    // Route events to appropriate handlers
    switch (eventType) {
        case 'meeting.started':
            handleMeetingStarted(payload);
            break;
        case 'meeting.ended':
            handleMeetingEnded(payload);
            break;
        case 'meeting.participant_qos':
        case 'meeting.participant_qos_summary':
            handleQosEvent(eventType, payload);
            break;
        default:
            console.log(`Unhandled event type: ${eventType}`);
    }
}

// Handler for meeting start events
function handleMeetingStarted(payload) {
    const uuid = payload.object.uuid;
    const meetingId = payload.object.id;
    meetingMap.set(uuid, meetingId);
    console.log(`Meeting started: Meeting ID ${meetingId}, UUID ${uuid}`);
}

// Handler for meeting end events
function handleMeetingEnded(payload) {
    const uuid = payload.object.uuid;
    if (meetingMap.has(uuid)) {
        const meetingId = meetingMap.get(uuid);
        meetingMap.delete(uuid);
        console.log(`Meeting ended: Meeting ID ${meetingId}, UUID ${uuid}`);
    } else {
        console.log(`Meeting ended event for unknown UUID: ${uuid}`);
    }
}

// Handler for QoS (Quality of Service) events
function handleQosEvent(eventType, payload) {
    const uuid = payload.object.uuid;
    if (meetingMap.has(uuid)) {
        const meetingId = meetingMap.get(uuid);
        console.log(`${eventType} for Meeting ID ${meetingId}, UUID ${uuid}`);
        processQosData(eventType, payload, meetingId, uuid);
    } else {
        console.log(`${eventType} event for unknown meeting UUID: ${uuid}`);
    }
}

// Process and log QoS data
function processQosData(eventType, payload, meetingId, uuid) {
    const participantEmail = payload.object.participant.email;
    console.log(`Processing ${eventType} data for meeting ${meetingId} (UUID: ${uuid}), participant: ${participantEmail}`);
    
    if (eventType === 'meeting.participant_qos') {
        // Log individual QoS data points
        payload.object.participant.qos.forEach(qos => {
            console.log(`QoS data: ${qos.type}, bitrate: ${qos.details.bitrate}, latency: ${qos.details.latency}`);
        });
    } else if (eventType === 'meeting.participant_qos_summary') {
        // Log QoS summary data
        payload.object.participant.qos.forEach(qos => {
            console.log(`QoS summary: ${qos.type}, avg bitrate: ${qos.details.avg_bitrate}, avg latency: ${qos.details.avg_latency}`);
        });
    }
}

// Webhook endpoint
app.post('/webhook', (req, res) => {
    const event = req.body;

    // Handle Zoom's webhook validation request
    if (event.event === 'endpoint.url_validation') {
        const hashForValidate = crypto
            .createHmac('sha256', ZOOM_WEBHOOK_SECRET_TOKEN)
            .update(event.payload.plainToken)
            .digest('hex');

        res.status(200).json({
            plainToken: event.payload.plainToken,
            encryptedToken: hashForValidate
        });
    } else {
        // Process other webhook events
        try {
            processEvent(event);
            res.sendStatus(200);
        } catch (error) {
            console.error('Error processing event:', error);
            res.sendStatus(500);
        }
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});