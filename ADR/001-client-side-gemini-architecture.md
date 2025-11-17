# ADR 001: Serverless, Client-Side Gemini API Architecture

-   **Status**: Accepted
-   **Date**: 2024-07-25
-   **Deciders**: Senior Frontend Engineering Team

## Context and Problem Statement

We need to build a web application that heavily relies on the Google Gemini API for its core features (predictions, conversational AI, news generation). A key architectural decision is where the API calls should originate.

The traditional approach involves a dedicated backend server (e.g., Node.js, Python) that acts as a proxy. The client (React app) would make requests to our backend, which would then securely call the Gemini API and return the results.

An alternative is a serverless, client-side approach where the React application directly communicates with the Gemini API using the `@google/genai` SDK. This requires the API key to be available in the client's execution environment.

## Decision

We have decided to adopt a **serverless, client-side architecture**. The React application will directly instantiate the `@google/genai` client and make all necessary calls to the Gemini API from the browser.

The API key will be managed and injected into the client environment by the hosting platform (e.g., AI Studio). The application code will access it via `process.env.API_KEY` but will not be responsible for storing or managing it.

## Consequences

### Positive

1.  **Simplified Architecture & Reduced Overhead**: We eliminate the need to develop, deploy, and maintain a separate backend server. This significantly reduces infrastructure complexity, operational costs, and development time.
2.  **Lower Latency**: For features like the `live.connect` API (J.A.R.V.I.S. companion), direct communication from the client to the Gemini API is crucial. Bypassing a backend proxy minimizes network hops, resulting in the lowest possible latency for real-time audio streaming and responses.
3.  **Scalability**: The application's scalability is directly tied to the scalability of the Gemini API and the frontend hosting platform (e.g., a CDN), which are managed services designed for high traffic. We do not need to manage server scaling.
4.  **Faster Development Velocity**: Frontend developers can work independently on features without needing backend changes or coordination, accelerating the development cycle.

### Negative

1.  **API Key Exposure**: While the key is not hardcoded in the repository, it is present in the client-side code's memory during execution. This is an accepted trade-off within secure hosting environments like AI Studio, which provide mechanisms for secure key injection. For production applications outside such environments, API key restrictions (e.g., by HTTP referrer) are essential to mitigate misuse.
2.  **Lack of Backend Logic**: Complex business logic, data caching, or request aggregation that would typically live on a server must now be handled on the client or through other serverless solutions (like Cloud Functions) if needed in the future. For the current scope, this is not a limitation.
3.  **Rate Limiting**: Without a backend, we cannot implement a centralized rate-limiting or request-caching strategy for multiple users. Rate limiting is handled on a per-user basis by the Gemini API itself.
