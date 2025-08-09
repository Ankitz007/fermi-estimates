# System Design Estimation Guide

An interactive web app for mastering quantitative estimation in system design interviews and architecture. This project helps engineers break down ambiguous requirements, make defensible calculations, and connect numbers to architectural choices.

## Features
- **5-Step Estimation Framework:** Learn a proven process for clarifying scope, decomposing problems, anchoring assumptions, calculating simply, and sanity-checking results.
- **Reference Tables:** Quick access to essential data volumes, object sizes, and request rate conversions.
- **Latency Chart:** Visualize the orders-of-magnitude differences in system latency, justifying caching and architectural decisions.
- **Problem Explorer:** Browse real-world system design scenarios (photo sharing, ride sharing, video streaming, chat, URL shortener, logging, web crawler, key-value store, typeahead, message queue, stock trading, food delivery, hotel booking, code repository, ad network) with functional/non-functional requirements and quantitative estimations.
- **Synthesis Section:** See how estimation outcomes map directly to architectural patterns (caching, streaming ingestion, object storage, edge deployment, connection gateways, microservices, geospatial indexing).

## Usage
1. Open `index.html` in your browser.
2. Explore the interactive sections:
   - Core Concepts: Learn the estimation framework and reference data.
   - Problem Explorer: Filter and study system design problems.
   - Synthesis: Connect numbers to architecture.

## Technologies
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Chart.js](https://www.chartjs.org/) for data visualization
- Vanilla JavaScript for interactivity

## File Structure
- `index.html`: Main web page and UI
- `app.js`: All interactive logic, data, and rendering

## Credits
- Powered by Google Gemini
