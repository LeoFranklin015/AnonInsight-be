# AnonInsight-be

AnonInsight-be is the backend service for Anon Insight, a versatile tool designed to conduct rating surveys or polls anonymously on any web3/web2 app. In the backend, we receive regex patterns and the Sindri API key. We utilize the Zk-email regex function to dynamically generate circuits according to the provided regex patterns. The Sindri service is automated to deploy these circuits and return the circuit IDs to the admin dashboard.

## Features

- **Dynamic Circuit Generation**: Generate circuits dynamically based on provided regex patterns.
- **Sindri Integration**: Automated deployment of circuits using the Sindri service.
- **Admin Dashboard Integration**: Return circuit IDs to the admin dashboard for management and tracking.

## Getting Started

To get started with AnonInsight-be, follow these steps:

1. **Install Dependencies**: Install the necessary dependencies using npm or yarn.

```bash
npm install
```

and run using 

```bash
node index.js
```
