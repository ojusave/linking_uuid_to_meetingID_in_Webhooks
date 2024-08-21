# Zoom Meeting Instance Tracker

## Overview

This Node.js application provides a robust solution for tracking Zoom meeting instances, mapping meeting UUIDs to their corresponding static meeting IDs, and processing Quality of Service (QoS) data. It's designed to handle Zoom webhooks efficiently, maintaining an up-to-date record of active meetings and their associated data.

## Key Features

- Real-time tracking of Zoom meeting instances
- Efficient mapping between meeting UUIDs and static meeting IDs
- Processing of QoS data for active meetings
- Automatic cleanup of ended meeting instances

## Why It's Important

Zoom's QoS webhooks provide data using meeting UUIDs, which are unique to each meeting instance. However, for reporting and analysis, it's often more useful to associate this data with the static meeting ID. This application bridges that gap, allowing for more meaningful long-term analysis of meeting quality and performance.

## How It Works

1. **Meeting Start**:
   - Captures both meeting ID and UUID from the `meeting.started` webhook
   - Stores the UUID-to-ID mapping in `meetingMap`

2. **During the Meeting**:
   - Processes QoS events (`meeting.participant_qos` and `meeting.participant_qos_summary`)
   - Uses the UUID from these events to look up the corresponding meeting ID

3. **Meeting End**:
   - Removes the UUID-to-ID mapping when the `meeting.ended` webhook is received
   - Ensures `meetingMap` only contains active meetings

## Key Components

- `meetingMap`: A Map object storing UUID-to-ID mappings for active meetings
- Event handlers for different webhook types:
  - `handleMeetingStarted(payload)`
  - `handleMeetingEnded(payload)`
  - `handleQosEvent(eventType, payload)`
- `processQosData(eventType, payload, meetingId, uuid)`: Processes QoS data

## Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/zoom-meeting-tracker.git cd zoom-meeting-tracker
```
2. Install dependencies:
```
npm install

```

3. Set up environment variables:
Create a `.env` file in the root directory:

```
ZOOM_WEBHOOK_SECRET_TOKEN=your_zoom_webhook_secret_token PORT=3000

```


## Configuration

1. Update the `ZOOM_WEBHOOK_SECRET_TOKEN` in your `.env` file with your actual Zoom Webhook Secret Token.
2. (Optional) Modify the `PORT` if you want the server to listen on a different port.

## Usage

1. Start the server:

```
node server.js

```
2. Configure your Zoom account to send webhooks to `http://your-server-address:3000/webhook`

3. The application will automatically process incoming webhooks and maintain the meeting instance tracker.

## Zoom Webhook Configuration

1. Log in to the [Zoom App Marketplace](https://marketplace.zoom.us/)
2. Navigate to your app's configuration page
3. In the "Feature" section, find "Event Subscriptions" and click "Add Event Subscription"
4. Set the "Event notification endpoint URL" to your server's webhook endpoint
5. Subscribe to the following events:
- Meeting Started
- Meeting Ended
- Participant/Host Quality of Service
6. Save your changes and note down the "Secret Token"

## Code Structure

```javascript
const meetingMap = new Map();

function handleMeetingStarted(payload) {
const uuid = payload.object.uuid;
const meetingId = payload.object.id;
meetingMap.set(uuid, meetingId);
console.log(`New meeting instance started: Meeting ID ${meetingId}, UUID ${uuid}`);
}

function handleMeetingEnded(payload) {
const uuid = payload.object.uuid;
if (meetingMap.has(uuid)) {
 const meetingId = meetingMap.get(uuid);
 meetingMap.delete(uuid);
 console.log(`Meeting instance ended: Meeting ID ${meetingId}, UUID ${uuid}`);
}
}

function handleQosEvent(eventType, payload) {
const uuid = payload.object.uuid;
if (meetingMap.has(uuid)) {
 const meetingId = meetingMap.get(uuid);
 console.log(`${eventType} for Meeting ID ${meetingId}, UUID ${uuid}`);
 processQosData(eventType, payload, meetingId, uuid);
}
}

// ... (other functions and server setup)
```

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License - see the LICENSE.md file for details.