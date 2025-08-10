const appData = {
    framework: [
        { title: "1. Clarify Scope & State Assumptions", content: "Define boundaries and ask clarifying questions. Are we estimating average or peak traffic? Storage for raw data or replicas too? Explicitly state all assumptions (e.g., 'Assuming 10M DAU, 20% active at peak'). This allows the interviewer to follow your logic and offer corrections." },
        { title: "2. Decompose the Problem", content: "Break the large problem into a product of smaller, estimable components. Write out the formula first. For example:<br><div class='estimation-code mt-3'><code>Daily_Storage = DAU × Users_Who_Post × Avg_Photos_Per_Post × Avg_Size_Per_Photo</code></div>This transforms one large guess into several smaller, more defensible ones." },
        { title: "3. Assume and Anchor with Known Values", content: "Assign a reasonable, rounded value to each component. Use powers of ten and simple numbers (e.g., 100k seconds/day instead of 86,400). Anchor assumptions to known facts (e.g., population of a country, capacity of a server) to ground the estimation in reality." },
        { title: "4. Calculate with Simplicity", content: "Perform the arithmetic using your rounded numbers and powers of ten. For example:<br><div class='estimation-code mt-3'><code>(5 × 10⁵) × (2 × 10⁵ bytes) = 100 GB</code></div>The goal is transparency, not complex math. A key shortcut: 1 million requests/day ≈ 12 requests/second." },
        { title: "5. Sanity-Check the Result", content: "Step back and evaluate if the final number is plausible. If your new app requires more storage than Google, a mistake was likely made. Compare the result to known benchmarks if possible (e.g., 'This QPS is 1% of Twitter's scale, which seems reasonable'). This demonstrates critical thinking." }
    ],
    referenceTables: [
        { title: "Latency Numbers Every Engineer Must Know", description: "The vast differences in latency justify major architectural decisions like caching. A key goal is to shift work from high-latency (disk) to low-latency (memory) operations. Understanding these orders of magnitude helps in making informed system design choices.", headers: ["Operation", "Typical Latency", "Architectural Impact"], rows: [["L1 Cache Reference", "0.5 ns", "Fastest possible memory access"], ["Branch Mispredict", "5 ns", "CPU pipeline optimization"], ["L2 Cache Reference", "7 ns", "Still very fast, on-chip"], ["Mutex Lock/Unlock", "25 ns", "Synchronization overhead"], ["Main Memory Reference", "100 ns", "RAM access - optimization target"], ["Compress 1KB with Zippy", "10 μs", "CPU-intensive operation"], ["Send 1KB over 1 Gbps Network", "10 μs", "Network I/O becomes significant"], ["Read 4KB Randomly from SSD", "150 μs", "SSD random access"], ["Read 1MB Sequentially from Memory", "250 μs", "Memory bandwidth limit"], ["Round Trip within Same Datacenter", "0.5 ms", "Network latency within DC"], ["Read 1MB Sequentially from SSD", "1 ms", "SSD sequential read"], ["Disk Seek", "10 ms", "Traditional HDD seek time"], ["Read 1MB Sequentially from Disk", "30 ms", "HDD sequential read"], ["Send Packet CA→Netherlands→CA", "150 ms", "Global network latency"]] },
        { title: "Data Volume (Powers of Two)", description: "Understanding the orders of magnitude is crucial. The difference between a Gigabyte and a Terabyte is the difference between data that fits on one server and data that requires a distributed system. These units form the language of scale.", headers: ["Power", "Name", "Abbreviation", "Approximate Size"], rows: [["2<sup>10</sup>", "Kilobyte", "KB", "1 thousand bytes"], ["2<sup>20</sup>", "Megabyte", "MB", "1 million bytes"], ["2<sup>30</sup>", "Gigabyte", "GB", "1 billion bytes"], ["2<sup>40</sup>", "Terabyte", "TB", "1 trillion bytes"], ["2<sup>50</sup>", "Petabyte", "PB", "1 quadrillion bytes"]] },
        { title: "Common Data Object Sizes", description: "Having a feel for the size of common data types helps anchor storage and bandwidth calculations in reality. Estimating storage for a text post vs. a high-resolution video leads to vastly different architectural choices.", headers: ["Data Object / Metric", "Average Size / Rate"], rows: [["User ID", "8 bytes"], ["Text Post", "500 bytes"], ["User Profile", "1-5 KB"], ["Thumbnail Image", "50-100 KB"], ["High-Res Photo", "2-5 MB"], ["1 min HD Video", "~30-50 MB"], ["1 Gbps Throughput", "~125 MB/s"]] },
        { title: "Time & Request Rate Conversions", description: "These shortcuts are essential for quickly translating high-level user activity (e.g., '100 million daily views') into the per-second metrics (QPS) that systems are actually measured and provisioned against.", headers: ["Daily Requests", "Approximate QPS"], rows: [["1 million/day", "~12 QPS"], ["10 million/day", "~120 QPS"], ["100 million/day", "~1,200 QPS"], ["1 billion/day", "~12,000 QPS"]] }
    ],
    problems: [
        { id: 1, title: "Photo-Sharing Service", domain: "Consumer", tags: ["Read-Heavy", "Petabyte-Scale"], functional: ["<strong>User Management</strong> Users can register, log in, and manage profiles, forming the basis of identity.", "<strong>Content Upload</strong> Users can upload photos and videos with captions. This is the primary write path.", "<strong>Feed Generation</strong> Users view a personalized, reverse-chronological feed of content from users they follow. This is the primary read path.", "<strong>Social Graph</strong> Users can follow and unfollow others, forming the network that powers the feed.", "<strong>Interaction</strong> Users can like and comment on posts, driving engagement and providing signals for ranking."], nonFunctional: ["<strong>High Availability (99.99%)</strong> The service must be consistently accessible, as downtime impacts user trust and engagement.", "<strong>Low Latency (<200ms feed load)</strong> Feeds must load almost instantly to provide a fluid, non-frustrating user experience.", "<strong>High Durability (11 nines)</strong> User-uploaded content is irreplaceable and must never be lost. This mandates robust backup and replication.", "<strong>Scalability for Viral Content</strong> The system must gracefully handle sudden, massive traffic spikes caused by viral posts or events.", "<strong>Eventual Consistency</strong> Follower counts and like counts can have a slight delay in updates across the system to improve performance and availability."], estimations: [{ title: "Write QPS (Uploads)", calc: "500M DAU * 10% post * 2 posts/user / 10<sup>5</sup>s ≈ 1,000 QPS (Peak 2k)", implication: "Establishes the baseline write load." }, { title: "Read QPS (Feed Views)", calc: "500M DAU * 20 refreshes / 10<sup>5</sup>s ≈ 100,000 QPS (Peak 200k)", implication: "The 100:1 read-to-write ratio is the key driver. Aggressive, multi-layer caching is mandatory." }, { title: "Daily Storage Ingress", calc: "(80M photos * 2MB) + (20M videos * 30MB) ≈ 760 TB/day", implication: "Blob storage volume is significant." }, { title: "5-Year Total Storage", calc: "840 TB/day * 365 * 5 * 3 replicas ≈ 2.7 Exabytes", implication: "Requires a commodity object store like S3; a traditional DB is not feasible." }, { title: "Peak Egress Bandwidth", calc: "200k QPS * 20MB/view ≈ 4 TB/s (32 Tbps)", implication: "Enormous egress mandates a global CDN to cache content near users." }], qps: { read: 200000, write: 2000 } },
        { id: 2, title: "Ride-Sharing Service", domain: "Consumer", tags: ["Write-Heavy", "Geospatial"], functional: ["<strong>Ride Booking</strong> Riders can request a ride from their location to a destination. This is the core business transaction.", "<strong>Driver Matching</strong> The system matches a ride request with a nearby available driver, a complex real-time search problem.", "<strong>Real-Time Tracking</strong> Riders can see their assigned driver's location in real-time on a map, which requires a constant stream of data.", "<strong>Fare Calculation & Payment</strong> The system calculates the fare based on distance and time, and reliably processes the payment.", "<strong>Rating System</strong> Riders and drivers can rate each other, providing a crucial feedback loop for quality control."], nonFunctional: ["<strong>High Availability (99.99%)</strong> The service is critical transportation infrastructure and must be extremely reliable.", "<strong>Real-Time Latency (<1s update)</strong> Driver location updates must appear on the rider's map almost instantly.", "<strong>Strong Consistency for Ride State</strong> The state of a ride (requested, accepted, in-progress, completed) must be strongly consistent for all parties.", "<strong>Reliability</strong> The system must reliably process ride requests and payments without errors.", "<strong>Peak Load Scalability</strong> The system must handle extreme traffic peaks, such as on New Year's Eve or after a major event."], estimations: [{ title: "Driver Location Update QPS", calc: "1M active drivers / 4s update freq = 250,000 QPS", implication: "Very high, constant write load. Requires a scalable ingestion pipeline (e.g., Kafka) and a write-optimized geospatial DB." }, { title: "Rider Map View QPS", calc: "500k concurrent riders / 10s poll = 50,000 QPS", implication: "Significant read load. A push model (WebSockets) is more efficient than polling for broadcasting updates." }, { title: "5-Year Trip History Storage", calc: "20M trips/day * 5KB/trip * 1825 days * 3 replicas ≈ 540 TB", implication: "Manageable structured data. A sharded SQL or NoSQL DB is appropriate." }, { title: "Geospatial Index Cache Size", calc: "1M active drivers * 100 bytes/driver = 100 MB", implication: "The entire active driver set fits in RAM. Justifies an in-memory geospatial index (e.g., Redis) for ultra-fast 'nearby driver' lookups." }, { title: "Ride Request API QPS", calc: "4M peak hour requests / 3600s ≈ 1,100 QPS", implication: "This is the core business transaction. API gateway and microservices must be robust and reliable." }], qps: { read: 50000, write: 250000 } },
        { id: 3, title: "Video-Streaming Platform", domain: "Consumer", tags: ["Bandwidth-Heavy", "CDN"], functional: ["<strong>Authentication</strong> Subscribers can log in to their accounts to access content.", "<strong>Content Browsing</strong> Users can search and browse a catalog of movies and TV shows, requiring fast metadata access.", "<strong>Video Streaming</strong> Users can stream video content in various qualities (SD, HD, 4K) with adaptive bitrate.", "<strong>Playback Control</strong> Users can play, pause, seek, and control volume, which requires state management for each stream.", "<strong>Personalization</strong> The system provides personalized recommendations based on viewing history, a data-intensive offline process."], nonFunctional: ["<strong>High Availability</strong> The service must be highly available, especially during primetime viewing hours.", "<strong>Low Start-up Latency (1-2s)</strong> Video playback should start within 1-2 seconds of the user pressing play, a key user experience metric.", "<strong>High Throughput</strong> The system must deliver massive amounts of video data globally without buffering.", "<strong>Scalability for Concurrent Viewers</strong> Must handle huge concurrent viewing audiences for popular releases.", "<strong>Fault Tolerance</strong> The viewing experience should be resilient to transient network issues, seamlessly switching bitrates."], estimations: [{ title: "Total Video Catalog Storage", calc: "50k titles * 10 GB/title (avg over 5 encodings) * 3 replicas = 1.5 PB", implication: "Requires large-scale object storage. Distribution is more critical than total size." }, { title: "Peak Egress Bandwidth", calc: "60M concurrent streams * 5 Mbps/stream = 300 Tbps", implication: "Colossal bandwidth. Impossible to serve from central data centers. Mandates a massive, global CDN (like Netflix's Open Connect)." }, { title: "New Content Ingestion Bandwidth", calc: "50 TB/month / 2.5M s/month ≈ 20 MB/s", implication: "Ingestion is trivial compared to egress. The complexity is in the transcoding and distribution pipeline, not the upload." }, { title: "Transcoding Compute", calc: "1hr video * 5 formats * 2 compute-hrs/hr = 10 compute-hours", implication: "Requires a highly parallel, task-based compute farm to transcode video chunks simultaneously." }, { title: "Hot Metadata Cache Size", calc: "50k titles * 10 KB/title = 500 MB", implication: "The entire catalog's metadata fits easily in RAM, simplifying the browse/search problem." }], qps: { read: 60000000, write: 1 } },
        { id: 4, title: "Real-Time Chat Application", domain: "Consumer", tags: ["Connections", "Fan-Out"], functional: ["<strong>Registration</strong> Users register with their phone number, linking their identity to a device.", "<strong>1-to-1 & Group Chat</strong> Users can send and receive messages in real-time to individuals or groups.", "<strong>Media Sharing</strong> Users can send images, videos, and other files, which follow a different data path than text messages.", "<strong>Presence & Status</strong> Users can see the online status ('presence') of their contacts and view read receipts.", "<strong>Push Notifications</strong> The system must deliver notifications for new messages even when the app is in the background."], nonFunctional: ["<strong>High Reliability (exactly-once, in-order)</strong> Messages must be delivered exactly once and in the correct sequence within a conversation.", "<strong>Low Latency (<1s)</strong> Messages should be delivered in near real-time to feel conversational.", "<strong>Scalability (billions of users)</strong> System must handle billions of users and tens of billions of messages per day.", "<strong>High Availability</strong> The service must be constantly available for communication.", "<strong>Security</strong> Messages should be end-to-end encrypted, meaning the server cannot read their content."], estimations: [{ title: "Peak Concurrent Connections", calc: "1B DAU * 50% connected = 500 Million", implication: "This is the most critical number. Requires persistent connections (WebSockets) and a dedicated connection gateway layer handling 50k-100k connections per server." }, { title: "Message Ingestion/Delivery QPS", calc: "40B messages/day -> 400k QPS (ingest). Fan-out to 120B deliveries/day -> 1.2M QPS (delivery).", implication: "Massive QPS for both sending and receiving, requiring a highly scalable messaging backend." }, { title: "Transient Message Storage", calc: "40B msgs * 1% undelivered * 200 bytes = 80 GB", implication: "Storage for undelivered messages is small. The challenge is managing millions of user-specific message queues, not volume. A key-value store is suitable." }, { title: "Daily Media Storage Ingress", calc: "4B media msgs/day * 500 KB/msg = 2 PB/day", implication: "Requires a massive object storage solution, separate from the real-time text message path." }, { title: "Presence Update Fan-out QPS", calc: "2 Trillion notifications/day / 10<sup>5</sup>s = 20 Million QPS", implication: "Fan-out is enormous. Cannot push for every status change. System must be smart and only send updates to a user's currently online contacts." }], qps: { read: 1200000, write: 400000 } },
        { id: 5, title: "URL Shortening Service", domain: "Consumer", tags: ["Read-Heavy", "Low-Latency"], functional: ["<strong>URL Shortening</strong> Users can submit a long URL and receive a unique, short URL.", "<strong>URL Redirection</strong> Users accessing a short URL are redirected to the original long URL via an HTTP 301/302 response.", "<strong>Custom Aliases</strong> Users can optionally request a specific custom short URL string.", "<strong>Analytics</strong> The service tracks the number of clicks for each short URL, providing basic analytics.", "<strong>API Access</strong> Provide a simple API for other services to create short URLs programmatically."], nonFunctional: ["<strong>High Availability (99.999%)</strong> The redirection service must be extremely reliable, as broken links are unacceptable.", "<strong>Low Latency (<50ms redirect)</strong> Redirections must be exceptionally fast to provide a seamless user experience.", "<strong>Scalability</strong> The system must handle a high volume of both creations and a much higher volume of redirections.", "<strong>Data Integrity</strong> The mapping from a short URL to a long URL must never be corrupted or lost.", "<strong>Compactness</strong> Generated short URLs must be as short as possible to be practical and easy to share."], estimations: [{ title: "Write QPS (Creations)", calc: "500M URLs/month / 2.5M s/month ≈ 200 QPS", implication: "Write load is moderate." }, { title: "Read QPS (Redirections)", calc: "Assuming 100:1 read/write ratio -> 200 * 100 = 20,000 QPS", implication: "System is overwhelmingly read-heavy. Design must optimize for fast, scalable reads." }, { title: "10-Year URL Mapping Storage", calc: "60B URLs * 500 bytes/URL * 3 replicas = 90 TB", implication: "Manageable data size. A sharded key-value store (DynamoDB, Cassandra) is ideal for fast key-based lookups." }, { title: "Hot URL Cache Size", calc: "Cache 20% of 1 year's URLs -> 1.2B URLs * 500 bytes = 600 GB", implication: "A distributed cache (Redis, Memcached) can handle this and absorb the vast majority of the read load, protecting the database." }, { title: "Key Space Capacity", calc: "Using [a-zA-Z0-9] (62 chars), a 7-char key gives 62<sup>7</sup> ≈ 3 Trillion combinations", implication: "Confirms the feasibility of the shortening mechanism, providing more than enough capacity for decades." }], qps: { read: 40000, write: 400 } },
        { id: 6, title: "Logging & Metrics System", domain: "Enterprise", tags: ["Ingestion-Heavy", "Big-Data"], functional: ["<strong>Data Collection Agent</strong> Lightweight agents installed on customer servers collect logs and metrics and send them to the service.", "<strong>Ingestion & Parsing</strong> The system must ingest massive, high-volume streams and parse semi-structured data.", "<strong>Indexing & Storage</strong> Data must be indexed for fast searching and stored for a defined retention period.", "<strong>Querying & Visualization</strong> Users can perform complex queries on their data and build real-time dashboards.", "<strong>Alerting</strong> Users can define rules on metrics or log patterns that trigger alerts when conditions are met."], nonFunctional: ["<strong>High Availability</strong> Customers rely on this system for production monitoring; it must be highly available.", "<strong>High Throughput (no data drops)</strong> The ingestion pipeline must handle the aggregate data volume from all customers without dropping data.", "<strong>Data Durability</strong> Once accepted by the service, log and metric data should not be lost.", "<strong>Low Query Latency</strong> Searches over terabytes of recent data should return in seconds.", "<strong>Elasticity</strong> The system must scale as customers add or remove servers, handling variable load gracefully."], estimations: [{ title: "Data Ingestion Rate", calc: "10M servers * (1KB/s logs + 0.17KB/s metrics) ≈ 12 GB/s", implication: "Massive, continuous ingestion rate. Architecture must be a high-throughput streaming pipeline, starting with a message queue like Kafka." }, { title: "Daily Storage Ingress", calc: "12 GB/s * 86,400 s/day ≈ 1.2 PB/day", implication: "Petabyte-scale daily storage. Rules out traditional DBs. Requires a distributed filesystem (HDFS) or object store with a specialized time-series DB (Elasticsearch)." }, { title: "Hot/Cold Tiered Storage", calc: "30 days hot (18 PB, SSDs) + 11 months cold (134 PB, disks)", implication: "Justifies a tiered storage architecture to balance query performance and cost." }, { title: "Message Queue Buffer Size", calc: "12 GB/s ingress * 2-hour retention = 86.4 TB", implication: "A massive Kafka cluster is needed not just for throughput but also to store terabytes of data on its brokers for buffering." }, { title: "Query QPS", calc: "100k active engineers * 5 queries/min / 60s ≈ 8,300 QPS", implication: "Substantial query load. Requires a dedicated, powerful query-serving layer executing against the hot tier." }], qps: { read: 8300, write: 12000000 } },
        { id: 7, title: "Web Crawler", domain: "Enterprise", tags: ["Throughput", "Politeness"], functional: ["<strong>URL Discovery</strong> Discover new URLs to crawl from links in existing pages and sitemaps.", "<strong>Content Fetching</strong> Download the HTML content of web pages over HTTP/HTTPS.", "<strong>Content Parsing</strong> Parse HTML to extract text content, metadata (titles, descriptions), and outgoing links.", "<strong>Data Storage</strong> Store the crawled pages and parsed content for the indexing system.", "<strong>Crawl Scheduling</strong> Re-crawl pages periodically to detect updates, prioritizing important pages more frequently."], nonFunctional: ["<strong>Scalability</strong> The system must be able to scale to crawl billions of pages across the entire web.", "<strong>High Throughput</strong> The system must be able to fetch a high number of pages per second to keep the index fresh.", "<strong>Politeness</strong> The crawler must not overload any single web server; it must obey `robots.txt` and limit its request rate per domain.", "<strong>Robustness</strong> The crawler must gracefully handle network errors, timeouts, and malformed HTML.", "<strong>Extensibility</strong> It should be easy to add new parsers for different content types (e.g., PDFs, images)."], estimations: [{ title: "Total Storage for Raw Pages", calc: "10B pages * 100 KB/page * 3 replicas = 3 PB", implication: "Requires a petabyte-scale distributed file system or object store." }, { title: "Required Network Bandwidth", calc: "1 PB data / 30 days ≈ 400 MB/s or 3.2 Gbps", implication: "Achievable bandwidth. The main challenge is managing millions of concurrent, slow connections, not total throughput." }, { title: "URL Frontier (Queue) Size", calc: "10B URLs to visit * 100 bytes/URL = 1 TB", implication: "The URL list itself is a large dataset. It requires a distributed, persistent queueing system that can manage prioritization and politeness." }, { title: "DNS Lookup QPS", calc: "400 MB/s / 100 KB/page ≈ 4,000 QPS", implication: "The crawler is a massive source of DNS traffic. It requires its own highly scalable, distributed DNS resolver cache to avoid being a bottleneck." }, { title: "Web Graph Storage", calc: "200B links * 16 bytes/link = 3.2 TB", implication: "The link graph is a multi-terabyte dataset crucial for PageRank, requiring storage suitable for large-scale graph processing." }], qps: { read: 4000, write: 4000 } },
        { id: 8, title: "Distributed Key-Value Store", domain: "Enterprise", tags: ["Scalability", "Low-Latency"], functional: ["<strong>CreateTable</strong> Users can create a new key-value table with specified capacity.", "<strong>Put Item</strong> Store an item (a value) associated with a primary key, overwriting any existing item.", "<strong>Get Item</strong> Retrieve an item by its primary key.", "<strong>Delete Item</strong> Remove an item by its primary key.", "<strong>Update Item</strong> Modify an existing item atomically (e.g., increment a counter)."], nonFunctional: ["<strong>High Availability</strong> The service must be highly available, tolerating node and even data center failures.", "<strong>Horizontal Scalability</strong> The system must scale horizontally to handle vast amounts of data and traffic by adding more servers.", "<strong>Low Latency</strong> Get/Put operations should have predictable, single-digit millisecond latency.", "<strong>Configurable Consistency</strong> Offer both strongly consistent and eventually consistent reads to allow trade-offs.", "<strong>Durability</strong> Data written to the store should be durable and replicated across multiple failure domains."], estimations: [{ title: "Total Storage Capacity", calc: "1k tables * 1B items/table * 1KB/item * 3 replicas = 3 PB", implication: "Requires robust data partitioning (sharding) and automatic rebalancing across thousands of servers." }, { title: "Number of Servers", calc: "3 PB / 30 TB/server ≈ 100 servers", implication: "Gives an order-of-magnitude fleet size. The core challenge is managing this fleet, routing requests, and handling failures." }, { title: "Peak QPS per Table", calc: "10,000 QPS target / 2,000 QPS/server = 5 servers", implication: "A single table may be partitioned across multiple servers for throughput, not just for storage. Consistent hashing is critical." }, { title: "Replication Traffic", calc: "1M total write QPS * 1KB/item * 2 replicas = 2 GB/s", implication: "Internal east-west network traffic is double the client-facing write traffic. The data center network must be high-speed." }, { title: "Partitioning Metadata Storage", calc: "100 servers * 256 vnodes/server * 8 bytes ≈ 200 KB", implication: "The hash ring map is tiny. It can be gossiped between nodes or managed by a coordination service like ZooKeeper." }], qps: { read: 1000000, write: 1000000 } },
        { id: 9, title: "Typeahead Suggestion Service", domain: "Enterprise", tags: ["In-Memory", "Low-Latency"], functional: ["<strong>Suggestion Generation</strong> As a user types a prefix, return a list of popular queries that start with that prefix.", "<strong>Ranking</strong> The suggestions should be ranked by popularity, relevance, or other business logic.", "<strong>Data Updates</strong> The underlying query data should be updated periodically (e.g., daily) to reflect new trends.", "<strong>Personalization</strong> Suggestions could be personalized based on a user's language, location, or search history.", "<strong>API Endpoint</strong> A simple, fast API endpoint that takes a prefix and returns a ranked list of suggestions."], nonFunctional: ["<strong>Low Latency (<50ms)</strong> Suggestions must appear almost instantly to feel responsive and not interrupt the user's typing flow.", "<strong>High Availability</strong> The service is a core part of the user experience and must be highly available.", "<strong>High Throughput</strong> Must handle the aggregate QPS from every character typed in a search bar by all users.", "<strong>Scalability</strong> Must handle increases in the number of users and the size of the query dataset.", "<strong>Freshness</strong> The suggestions should be reasonably fresh, reflecting recent search trends."], estimations: [{ title: "Trie Storage", calc: "1B queries * 5 nodes/query * 100 bytes/node = 500 GB", implication: "Too large for one server's RAM. The Trie must be sharded (e.g., by first letter) and distributed across a cluster, with each server holding its shard in-memory." }, { title: "Read QPS", calc: "50k search QPS * 5 typeahead reqs/query = 250,000 QPS", implication: "Very high read QPS. The in-memory, sharded Trie design is essential to meet latency and throughput requirements." }, { title: "Number of Servers", calc: "250k QPS / 10k QPS/server = 25 servers", implication: "Relatively small compute fleet. The challenge is sharding the 500 GB Trie across them (20GB/server) and routing requests to the correct shard." }, { title: "Network Egress", calc: "250k QPS * 200 bytes/response = 50 MB/s (400 Mbps)", implication: "Network bandwidth is not a major concern. The bottleneck is CPU and memory access time to traverse the Trie." }, { title: "Data Update Ingress", calc: "500 GB Trie rebuilt daily over 2 hours ≈ 70 MB/s", implication: "The update is a significant operation. A common pattern is to build the new Trie offline and then hot-swap the data on live servers." }], qps: { read: 250000, write: 1 } },
        { id: 10, title: "Distributed Message Queue", domain: "Enterprise", tags: ["Throughput", "Durability"], functional: ["<strong>Create Topic</strong> Users can create a new topic, which is a named stream of messages.", "<strong>Produce Message</strong> Producers can send messages to a specific topic, optionally specifying a partition key.", "<strong>Consume Message</strong> Consumers can subscribe to a topic as part of a consumer group and read messages in order.", "<strong>Partitioning</strong> Topics are split into multiple partitions to allow for parallel processing and consumption.", "<strong>Offset Tracking</strong> The service tracks the read position (offset) for each consumer group in each partition."], nonFunctional: ["<strong>High Throughput</strong> Must support high-volume message production and consumption, often measured in GB/s.", "<strong>Durability</strong> Messages must be durably stored on disk and replicated to prevent data loss.", "<strong>Ordering Guarantee</strong> Messages within a single partition must be delivered in the exact order they were produced.", "<strong>High Availability</strong> The service must remain available for reads and writes even if some broker nodes fail.", "<strong>Scalability</strong> Users should be able to add partitions to a topic or brokers to the cluster to increase throughput."], estimations: [{ title: "Total Storage Capacity", calc: "1k topics * 1MB/s * 7 days * 3 replicas ≈ 1.8 PB", implication: "Requires a petabyte-scale storage layer on servers with large, fast disks (SSDs preferred for write latency)." }, { title: "Total Network Write Throughput", calc: "1GB/s client writes + 2GB/s replication writes = 3 GB/s", implication: "The data center network must support several GB/s of sustained traffic. This is a primary design constraint." }, { title: "Number of Servers (Brokers)", calc: "Storage (1.8PB/30TB) and Network (6GBps/100MBps) both point to ~60 servers", implication: "A fleet of ~60 brokers is needed. A coordination service (ZooKeeper) is required to manage broker state and partition leadership." }, { title: "Disk I/O Operations", calc: "Total write throughput of 1 GB/s", implication: "The core design relies on sequential disk I/O (log-append), which allows high throughput even on spinning disks by avoiding random access patterns." }, { title: "ZooKeeper Metadata Storage", calc: "10k partitions * 1KB/partition = 10 MB", implication: "Critical metadata is very small and can be easily managed by a small, highly available ZooKeeper ensemble (3-5 nodes)." }], qps: { read: 1000000, write: 1000000 } },
        { id: 11, title: "Real-Time Stock Trading", domain: "Niche", tags: ["Ultra-Low-Latency", "ACID"], functional: ["<strong>Market Data Display</strong> Users see real-time stock prices, volumes, and order book data streamed from the exchange.", "<strong>Order Submission</strong> Users can submit market and limit orders (buy/sell) which must be validated instantly.", "<strong>Portfolio Management</strong> Users can view their current holdings, cash balance, and profit/loss in real-time.", "<strong>Order Management</strong> Users can view the status of their open orders (e.g., partially filled) and cancel them.", "<strong>Trade Execution History</strong> Users can see a detailed, accurate history of their executed trades for accounting."], nonFunctional: ["<strong>Ultra-Low Latency (<1ms in DC)</strong> Order submission and market data delivery must have sub-millisecond latency within the data center.", "<strong>High Availability (99.999%)</strong> The system must be available during all market hours; downtime is extremely costly.", "<strong>Strong Consistency (ACID)</strong> Financial transactions must be atomic, consistent, isolated, and durable. No lost orders or incorrect balances.", "<strong>High Throughput Matching</strong> The matching engine must process tens of thousands of orders per second during volatile periods.", "<strong>Security</strong> The system must be secure against fraud, unauthorized access, and market manipulation attempts."], estimations: [{ title: "Market Data Fan-out", calc: "Ingress: 1M msgs/s. Egress: 100k users * 100 msgs/s * 100 bytes/msg = 1 GB/s", implication: "A dedicated, low-latency messaging system (UDP multicast or Aeron) is needed to distribute market data from the exchange gateway." }, { title: "Order Matching Engine QPS", calc: "Average QPS is low (~83), but system must handle microbursts of 50k-100k QPS.", implication: "The matching engine must be a single-threaded, in-memory process for strict ordering and extreme speed. Redundancy via hot-hot failover." }, { title: "Audit Trail Storage", calc: "1M orders/day * 5 events/order * 1KB/event * 7 years ≈ 13 TB", implication: "Audit data must be stored in a WORM-compliant format, separate from the real-time trading path." }, { title: "Portfolio Cache Size", calc: "100k concurrent users * 5 KB/user = 500 MB", implication: "All active user portfolios can be cached in memory for fast pre-trade risk checks, reducing load on the master database." }, { title: "Latency Budget", calc: "100ms total - 80ms cross-continent network = 20ms for all processing.", implication: "Physical co-location of servers in the same datacenter as the exchange is paramount to reduce network latency to microseconds." }], qps: { read: 100000, write: 100000 } },
        { id: 12, title: "Food Delivery Service", domain: "Niche", tags: ["Workflow", "Geospatial"], functional: ["<strong>Restaurant Discovery</strong> Customers can search for and browse menus of local restaurants.", "<strong>Order Placement</strong> Customers can place an order and pay for it, initiating a complex workflow.", "<strong>Order Fulfillment</strong> Restaurants receive the order on a tablet or POS system and must confirm and prepare it.", "<strong>Courier Dispatch</strong> A nearby courier is offered the delivery via their app, which they can accept or decline.", "<strong>Real-Time Tracking</strong> Customers can track the order status (e.g., 'Preparing') and the courier's location on a map."], nonFunctional: ["<strong>High Availability</strong> The system must be highly available, especially during peak meal times (lunch, dinner).", "<strong>Reliability</strong> Orders must not be lost; payments must be processed correctly; communication between all three parties must be reliable.", "<strong>Real-Time Latency</strong> Courier location and order status updates must be delivered in near real-time.", "<strong>Scalability</strong> Must handle peak demand during dinner rush or major events (e.g., Super Bowl).", "<strong>Consistency (across 3 parties)</strong> The state of an order must be strongly consistent for the customer, restaurant, and courier."], estimations: [{ title: "Peak Order QPS", calc: "1M dinner rush orders / 7200s ≈ 140 QPS", implication: "QPS isn't extreme, but each order kicks off a complex workflow. Requires a robust microservices architecture orchestrated by an order manager." }, { title: "Courier Location Update QPS", calc: "500k active couriers / 5s = 100,000 QPS", implication: "High, constant write load. Requires a dedicated ingestion service and a geospatial DB/cache, similar to a ride-sharing app." }, { title: "Restaurant Menu Storage", calc: "500k restaurants * 100 KB/menu = 50 GB", implication: "Menu data is small. Can be stored in a document DB and heavily cached in Redis for fast browsing." }, { title: "Dispatch System Geospatial QPS", calc: "140 order QPS -> 140 geospatial queries/sec", implication: "QPS is low, but queries are complex (distance, rating, etc.). Requires an efficient in-memory geospatial index of couriers." }, { title: "Push Notification QPS", calc: "20M notifications/day / 86,400s ≈ 230 QPS", implication: "Requires a reliable and scalable notification system that integrates with third-party services like APNS and FCM." }], qps: { read: 100, write: 100140 } },
        { id: 13, title: "Hotel Booking Aggregator", domain: "Niche", tags: ["API-Heavy", "Caching"], functional: ["<strong>Hotel Search</strong> Users can search for hotels by destination, dates, and number of guests.", "<strong>Availability & Pricing</strong> The system displays real-time (or near real-time) availability and pricing for rooms by querying suppliers.", "<strong>Booking</strong> Users can book a room. The system forwards this booking to the hotel's supplier system via an API call.", "<strong>Reviews & Ratings</strong> Users can view and submit reviews for hotels, which are a key factor in decision making.", "<strong>User Profiles</strong> Users can manage their bookings, payment methods, and personal preferences."], nonFunctional: ["<strong>High Availability</strong> The service must be available 24/7 for a global user base.", "<strong>Data Consistency</strong> Pricing and availability data must be as up-to-date as possible to avoid booking errors and customer dissatisfaction.", "<strong>Low Search Latency (<2s)</strong> Search results, which aggregate data from many sources, must appear quickly.", "<strong>Interoperability</strong> The system must integrate with thousands of heterogeneous third-party supplier APIs.", "<strong>Reliability</strong> Bookings must be reliably transmitted to the supplier, with robust mechanisms for handling failures."], estimations: [{ title: "Third-Party API Polling QPS", calc: "1M hotels / 10 min polling freq ≈ 1,700 QPS", implication: "Requires a robust, resilient, highly parallel poller service to constantly update data from thousands of heterogeneous supplier APIs." }, { title: "Search QPS", calc: "25M searches/day -> Peak ~900 QPS", implication: "Each search is heavy, involving querying a large dataset and potentially real-time supplier calls. A multi-level caching strategy is essential." }, { title: "Hotel Data Cache Size", calc: "1M hotels * 50 KB/hotel (static data) = 50 GB", implication: "Cache static data (info, photos) and search results for popular queries. The key challenge is cache invalidation when the poller gets new data." }, { title: "Booking QPS", calc: "250k bookings/day ≈ 3 QPS", implication: "Booking rate is very low compared to search. The booking workflow is mission-critical, requiring high reliability and transactional guarantees." }, { title: "Review Storage", calc: "10M reviews * 2 KB/review = 20 GB", implication: "Review data is small and can be stored in a standard DB and served from the main hotel data cache." }], qps: { read: 900, write: 1703 } },
        { id: 14, title: "Cloud-Based Code Repository", domain: "Niche", tags: ["Big-Data", "CPU-Intensive"], functional: ["<strong>Repository Hosting</strong> Users can create public and private Git repositories to store their source code.", "<strong>Git Operations</strong> Users can push and pull changes to repositories over SSH and HTTPS, the core version control functionality.", "<strong>Web Interface</strong> Users can browse code, view commit history, and manage repository settings through a web UI.", "<strong>Collaboration</strong> Users can file issues, submit pull requests, and perform code reviews, facilitating teamwork.", "<strong>CI/CD Integration</strong> The system can trigger automated builds and deployments on code pushes (e.g., GitHub Actions)."], nonFunctional: ["<strong>High Availability</strong> Developers rely on it for their daily work; downtime directly impacts productivity.", "<strong>Durability</strong> Source code is invaluable; it must never be lost, requiring multiple replicas and backups.", "<strong>Performance</strong> Git operations, especially for large repositories or complex histories, should be fast.", "<strong>Security</strong> Must protect private source code from unauthorized access with robust permission models.", "<strong>Scalability</strong> Must handle a growing number of users, repositories, and computationally intensive CI/CD workloads."], estimations: [{ title: "Total Git Storage", calc: "Weighted average of 100M repos * 3 replicas ≈ 8.4 PB", implication: "Requires a massive, durable distributed file system optimized for Git's I/O pattern of many small, compressed object files." }, { title: "Git Push/Pull QPS", calc: "25M ops/day -> Peak ~580 QPS", implication: "QPS is moderate, but each operation is CPU and I/O intensive. Requires a fleet of 'Git frontend' servers to handle the protocol." }, { title: "CI/CD Compute Workload", calc: "1.25M jobs/day * 5 min/job requires ~4,300 concurrent VMs", implication: "Requires a massive, elastic compute farm to run untrusted user code in sandboxed environments. A huge operational challenge." }, { title: "Web Interface Read QPS", calc: "500M page views/day -> ~5,800 QPS", implication: "Significant read load. Immutable content (code at a specific commit) can be heavily cached in Redis to reduce load on the Git backend." }, { title: "PR/Issue Metadata Storage", calc: "10B issues/PRs * 10 KB/item = 100 TB", implication: "This structured data is well-suited for a large, sharded relational or NoSQL database to power the collaboration features." }], qps: { read: 5800, write: 580 } },
        { id: 15, title: "Ad-Serving Network", domain: "Niche", tags: ["Ultra-Low-Latency", "High-Throughput"], functional: ["<strong>Ad Request</strong> The system receives a request for an ad from a user's browser on a publisher site.", "<strong>Targeting</strong> The system uses user data (cookies, location, context) to select the best ad campaign.", "<strong>Real-Time Auction</strong> The system runs a real-time auction among eligible advertisers to determine the winning ad.", "<strong>Ad Serving</strong> The system returns the winning ad creative (e.g., an image URL or JavaScript tag) to the user's browser.", "<strong>Impression/Click Tracking</strong> The system logs when an ad is viewed (impression) and when it is clicked for billing and analytics."], nonFunctional: ["<strong>Ultra-Low Latency (<100ms)</strong> The entire process from request to ad returned must complete in under 100 ms to not delay page load.", "<strong>High Availability</strong> Downtime means lost revenue for both the network and its publishers.", "<strong>Massive Throughput</strong> Must handle billions of requests per day from a global user base.", "<strong>Scalability</strong> Must scale to handle traffic from new publishers and a growing number of advertisers.", "<strong>Data-Intensive</strong> Must process huge volumes of data for targeting, bidding, and analytics."], estimations: [{ title: "Ad Request QPS", calc: "10B impressions/day -> Peak ~200,000 QPS", implication: "Massive, sustained read load. The entire ad selection pipeline must be optimized for speed and deployed at globally distributed edge data centers." }, { title: "User Profile Cache Size", calc: "1B user profiles * 1 KB/profile = 1 TB", implication: "Requires a distributed low-latency cache (Redis, Aerospike) co-located with ad servers at the edge to meet the latency budget." }, { title: "Tracking Data Ingress", calc: "10B log events/day * 500 bytes/event = 5 TB/day", implication: "Huge write volume. Log events from the edge are streamed via Kafka to a central data warehouse for offline processing and billing." }, { title: "Ad Creative Egress", calc: "100k QPS * 50 KB/creative = 5 GB/s (40 Gbps)", implication: "Massive bandwidth requirement. Ad creatives must be hosted on a CDN; the ad server only returns a small JSON response with the CDN URL." }, { title: "Ad Campaign Data Size", calc: "100k campaigns * 10 KB/campaign = 1 GB", implication: "The entire set of active campaigns is small enough to be replicated to every ad server and held in memory, enabling network-free, low-latency auctions." }], qps: { read: 200000, write: 58000 } }
    ],
    synthesis: [
        { outcome: "Extremely High Read:Write Ratio (>100:1)", pattern: "Aggressive, Multi-Layer Caching", examples: ["Photo Sharing", "URL Shortener", "Ad Serving"], description: "Implement caching at every possible layer—in-memory application cache, distributed cache (Redis/Memcached), and CDN at the edge." },
        { outcome: "Massive Write Throughput (>100k QPS)", pattern: "Streaming Ingestion Pipeline", examples: ["Ride Sharing (Locations)", "Logging System", "Chat App"], description: "Use a distributed message queue (Kafka/Pulsar) as a durable buffer to absorb writes, decoupling ingestion from processing." },
        { outcome: "Petabyte-Scale Data Volume", pattern: "Object Storage + Sharded Database", examples: ["Photo Sharing", "Video Streaming", "Web Crawler", "Code Repository"], description: "Store unstructured blobs (images, videos, files) in an object store (S3). Store structured metadata in a horizontally sharded database (Cassandra, DynamoDB, Vitess)." },
        { outcome: "Ultra-Low Latency Requirement (<50ms)", pattern: "In-Memory Computation & Edge Deployment", examples: ["Ad Serving", "Stock Trading", "Typeahead"], description: "Hold the entire working dataset in memory (RAM). Deploy compute nodes in globally distributed edge data centers, physically close to users." },
        { outcome: "Large Number of Persistent Connections (>1M)", pattern: "Dedicated Connection Gateway Layer", examples: ["Chat App"], description: "Use a fleet of servers running an event-driven framework (e.g., Netty) to manage persistent connections (WebSockets), separate from the application logic." },
        { outcome: "Complex, Asynchronous Workflows", pattern: "Microservices & Orchestration", examples: ["Food Delivery", "Hotel Booking", "CI/CD"], description: "Decompose the system into small, independent services. Use a workflow engine or event-driven choreography to manage the state and interaction between services." },
        { outcome: "Geospatial Queries at Scale", pattern: "In-Memory Geospatial Indexing", examples: ["Ride Sharing", "Food Delivery"], description: "Use a specialized data structure (e.g., Quadtree, R-tree) or a database with strong geo-features (PostGIS, Redis) to hold active locations in RAM for fast 'nearby' queries." }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    const frameworkAccordion = document.getElementById('framework-accordion');
    const referenceTablesContainer = document.getElementById('reference-tables-container');
    const filtersContainer = document.getElementById('filters');
    const problemsGrid = document.getElementById('problems-grid');
    const modal = document.getElementById('problem-modal');
    const modalBox = document.getElementById('modal-box');
    const closeModalBtn = document.getElementById('close-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const modalTabs = document.getElementById('modal-tabs');
    const synthesisContainer = document.getElementById('synthesis-container');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const scrollToTopBtn = document.getElementById('scroll-to-top');

    let currentChart = null;
    let currentQpsChart = null;

    // Helper function to format QPS numbers
    function formatQPS(qps) {
        if (qps >= 1000000) {
            return (qps / 1000000).toFixed(1) + 'M';
        } else if (qps >= 1000) {
            return (qps / 1000).toFixed(1) + 'K';
        }
        return qps.toString();
    }

    // Scroll to top functionality
    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Show/hide scroll to top button
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    });

    // Enhanced smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Close mobile menu if open
                mobileMenu.classList.add('hidden');
            }
        });
    });

    // Mobile menu toggle
    mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    // Enhanced Accordion for Framework
    appData.framework.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'framework-step bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-xl mb-4 overflow-hidden hover:shadow-md transition-all duration-300';
        div.innerHTML = `
            <button class="accordion-button w-full text-left p-6 font-semibold flex items-center transition-all duration-300 hover:bg-slate-100/50">
                <div class="step-number bg-gradient-to-r from-indigo-500 to-purple-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold mr-4 flex-shrink-0 shadow-lg">${index + 1}</div>
                <span class="flex-1 text-gray-800 text-lg">${item.title.replace(/^\d+\.\s*/, '')}</span>
                <div class="ml-4 w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-chevron-down transform transition-transform duration-300 text-slate-600 text-sm"></i>
                </div>
            </button>
            <div class="accordion-content bg-white">
                <div class="p-6 text-gray-700 leading-relaxed border-t border-slate-100">
                    ${item.content}
                </div>
            </div>
        `;
        frameworkAccordion.appendChild(div);
    });

    frameworkAccordion.addEventListener('click', (e) => {
        const button = e.target.closest('.accordion-button');
        if (button) {
            const content = button.nextElementSibling;
            const icon = button.querySelector('i');
            const stepContainer = button.parentElement;
            const isCurrentlyOpen = content.classList.contains('open');

            // Close all accordions and remove active states
            frameworkAccordion.querySelectorAll('.accordion-content').forEach(c => {
                c.style.maxHeight = null;
                c.classList.remove('open');
            });
            frameworkAccordion.querySelectorAll('.accordion-button i').forEach(i => i.classList.remove('rotate-180'));
            frameworkAccordion.querySelectorAll('.framework-step').forEach(s => s.classList.remove('active'));

            // If this accordion wasn't open, open it
            if (!isCurrentlyOpen) {
                // Force a reflow before calculating height
                content.style.display = 'block';
                content.offsetHeight; // Trigger reflow

                content.style.maxHeight = content.scrollHeight + "px";
                content.classList.add('open');
                icon.classList.add('rotate-180');
                stepContainer.classList.add('active', 'shadow-lg', 'border-indigo-200');

                // Recalculate height after any animations complete
                setTimeout(() => {
                    if (content.classList.contains('open')) {
                        content.style.maxHeight = content.scrollHeight + "px";
                    }
                }, 100);

                // Additional recalculation for mobile devices
                setTimeout(() => {
                    if (content.classList.contains('open')) {
                        content.style.maxHeight = content.scrollHeight + "px";
                    }
                }, 300);
            }
        }
    });

    // Reference Tables
    appData.referenceTables.forEach((table, index) => {
        const tableHtml = `
            <div class="table-container bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-6 border border-slate-200">
                <div class="flex items-center mb-6">
                    <div class="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                        <i class="fas fa-chart-line text-white text-lg"></i>
                    </div>
                    <div>
                        <h4 class="text-xl font-bold text-gray-800 mb-1">${table.title}</h4>
                        <p class="p-3 text-sm text-gray-600">${table.description}</p>
                    </div>
                </div>
                <div class="overflow-x-auto rounded-lg shadow-sm">
                    <table class="rounded-lg reference-table w-full">
                        <thead>
                            <tr>
                                ${table.headers.map(h => `<th class="bg-gradient-to-r from-gray-800 to-gray-900 text-white font-semibold px-6 py-4 text-left">${h}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${table.rows.map((r, idx) => `
                                <tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-indigo-50 transition-colors duration-200">
                                    ${r.map((d, cellIdx) => `<td class="px-6 py-4 text-sm text-gray-700 ${cellIdx === 0 ? 'font-semibold text-gray-900' : ''}">${d}</td>`).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        referenceTablesContainer.insertAdjacentHTML('beforeend', tableHtml);
    });

    // Filters
    const domains = ['All', ...new Set(appData.problems.map(p => p.domain))];
    domains.forEach(domain => {
        const button = document.createElement('button');
        button.className = 'filter-button border-2 border-gray-300 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300 hover:bg-gray-200';
        button.textContent = domain;
        button.dataset.filter = domain;
        if (domain === 'All') button.classList.add('active');
        filtersContainer.appendChild(button);
    });

    filtersContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            filtersContainer.querySelector('.active').classList.remove('active');
            e.target.classList.add('active');
            renderProblems(e.target.dataset.filter);
        }
    });

    // Render Problems
    function renderProblems(filter = 'All') {
        problemsGrid.innerHTML = '';
        const filteredProblems = filter === 'All' ? appData.problems : appData.problems.filter(p => p.domain === filter);

        filteredProblems.forEach(problem => {
            const card = document.createElement('div');
            const domainClass = `domain-${problem.domain.toLowerCase()}`;
            card.className = 'problem-card bg-white p-6 rounded-xl shadow-lg cursor-pointer hover:scale-105 transition-all duration-300';
            card.dataset.id = problem.id;
            card.innerHTML = `
                        <div class="flex justify-between items-start mb-3">
                            <h4 class="font-bold text-xl text-gray-800 flex-1 pr-2">${problem.title}</h4>
                            <div class="${domainClass} text-white text-xs font-bold px-3 py-1 rounded-full flex-shrink-0">
                                ${problem.domain}
                            </div>
                        </div>
                        <div class="flex flex-wrap gap-2 mb-4">
                            ${problem.tags.map(tag => `<span class="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full border border-blue-200">${tag}</span>`).join('')}
                        </div>
                        <div class="text-xs text-gray-500 flex justify-between items-center">
                            <span>📊 ${problem.estimations.length} Key Estimations</span>
                            <span class="flex items-center">
                                <span class="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                                R: ${formatQPS(problem.qps.read)} QPS
                                <span class="w-2 h-2 bg-red-400 rounded-full ml-2 mr-1"></span>
                                W: ${formatQPS(problem.qps.write)} QPS
                            </span>
                        </div>
                    `;
            problemsGrid.appendChild(card);
        });
    }

    problemsGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.problem-card');
        if (card) {
            showProblemDetails(card.dataset.id);
        }
    });

    function showProblemDetails(id) {
        const problem = appData.problems.find(p => p.id == id);
        if (!problem) return;

        modalTitle.textContent = problem.title;

        // Set initial tab
        renderModalContent(problem, 'requirements');
        modalTabs.querySelector('[data-tab="requirements"]').classList.add('active');
        modalTabs.querySelector('[data-tab="estimations"]').classList.remove('active');

        modal.classList.remove('hidden');
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
        setTimeout(() => modalBox.classList.add('active'), 10);
    }

    modalTabs.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const tab = e.target.dataset.tab;
            const problemId = appData.problems.find(p => p.title === modalTitle.textContent).id;
            const problem = appData.problems.find(p => p.id == problemId);

            modalTabs.querySelector('.active').classList.remove('active');
            e.target.classList.add('active');

            renderModalContent(problem, tab);
        }
    });

    function renderModalContent(problem, tab) {
        let content = '';
        if (tab === 'requirements') {
            content = `
                        <div class="grid md:grid-cols-2 gap-6 sm:gap-8">
                            <div class="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                                <div class="flex items-center mb-4">
                                    <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-3">
                                        <i class="fas fa-check-circle text-white"></i>
                                    </div>
                                    <h5 class="font-bold text-lg text-blue-800 border-b-2 border-blue-300 pb-1">Functional Requirements</h5>
                                </div>
                                <div class="space-y-3">
                                    ${problem.functional.map(r => `
                                        <div class="bg-white/70 p-3 rounded-lg border border-blue-100 hover:bg-white/90 transition-colors">
                                            <div class="text-sm text-gray-700 leading-relaxed">${r}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            <div class="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                                <div class="flex items-center mb-4">
                                    <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                                        <i class="fas fa-bolt text-white"></i>
                                    </div>
                                    <h5 class="font-bold text-lg text-purple-800 border-b-2 border-purple-300 pb-1">Non-Functional Requirements</h5>
                                </div>
                                <div class="space-y-3">
                                    ${problem.nonFunctional.map(r => `
                                        <div class="bg-white/70 p-3 rounded-lg border border-purple-100 hover:bg-white/90 transition-colors">
                                            <div class="text-sm text-gray-700 leading-relaxed">${r}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    `;
        } else if (tab === 'estimations') {
            content = `
                        <div class="space-y-6">
                            ${problem.estimations.map(est => `
                                <div class="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                    <h6 class="font-bold text-lg text-gray-800 mb-3 flex items-center">
                                        <span class="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                                        ${est.title}
                                    </h6>
                                    <div class="estimation-code mb-4">
                                        <code class="block whitespace-nowrap overflow-x-auto">${est.calc.replace(/\*/g, '×').replace(/<sup>/g, '').replace(/<\/sup>/g, '').replace(/≈/g, '<span class="highlight">≈</span>').replace(/×/g, '<span class="operator">×</span>')}</code>
                                    </div>
                                    <div class="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                                        <p class="text-sm text-blue-900"><strong class="font-semibold">Architectural Implication:</strong> ${est.implication}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="mt-10 bg-gray-50 p-6 rounded-xl">
                            <h5 class="font-bold text-xl mb-4 text-center text-gray-800">System Load Profile</h5>
                            <p class="text-center text-gray-600 mb-6 text-sm">Understanding the read/write ratio is crucial for architectural decisions</p>
                            <div class="chart-container relative h-64 w-full max-w-md mx-auto">
                                <canvas id="qpsChart"></canvas>
                            </div>
                        </div>
                    `;
        }
        modalContent.innerHTML = content;

        if (tab === 'estimations' && problem.qps) {
            if (currentQpsChart) {
                currentQpsChart.destroy();
            }
            const qpsCtx = document.getElementById('qpsChart').getContext('2d');
            currentQpsChart = new Chart(qpsCtx, {
                type: 'bar',
                data: {
                    labels: ['Peak Read QPS', 'Peak Write QPS'],
                    datasets: [{
                        label: 'Queries Per Second',
                        data: [problem.qps.read, problem.qps.write],
                        backgroundColor: ['rgba(52, 152, 219, 0.6)', 'rgba(231, 76, 60, 0.6)'],
                        borderColor: ['rgba(52, 152, 219, 1)', 'rgba(231, 76, 60, 1)'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            type: 'logarithmic',
                            title: { display: true, text: 'QPS (Log Scale)' }
                        }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }
    }

    closeModalBtn.addEventListener('click', () => {
        modalBox.classList.remove('active');
        // Restore body scrolling
        document.body.style.overflow = 'auto';
        setTimeout(() => modal.classList.add('hidden'), 300);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modalBox.classList.remove('active');
            // Restore body scrolling
            document.body.style.overflow = 'auto';
            setTimeout(() => modal.classList.add('hidden'), 300);
        }
    });

    // Synthesis Section - Enhanced with visual patterns
    const patternIcons = {
        'Aggressive, Multi-Layer Caching': 'fas fa-layer-group',
        'Streaming Ingestion Pipeline': 'fas fa-stream',
        'Object Storage + Sharded Database': 'fas fa-database',
        'In-Memory Computation & Edge Deployment': 'fas fa-microchip',
        'Dedicated Connection Gateway Layer': 'fas fa-network-wired',
        'Microservices & Orchestration': 'fas fa-cubes',
        'In-Memory Geospatial Indexing': 'fas fa-map-marked-alt'
    };

    const patternColors = {
        'Aggressive, Multi-Layer Caching': 'from-blue-500 to-blue-600',
        'Streaming Ingestion Pipeline': 'from-purple-500 to-pink-500',
        'Object Storage + Sharded Database': 'from-green-500 to-teal-500',
        'In-Memory Computation & Edge Deployment': 'from-yellow-500 to-orange-500',
        'Dedicated Connection Gateway Layer': 'from-indigo-500 to-purple-500',
        'Microservices & Orchestration': 'from-pink-500 to-rose-500',
        'In-Memory Geospatial Indexing': 'from-emerald-500 to-green-500'
    };

    appData.synthesis.forEach((item, index) => {
        const patternIcon = patternIcons[item.pattern] || 'fas fa-cog';
        const patternColor = patternColors[item.pattern] || 'from-gray-500 to-gray-600';

        const div = document.createElement('div');
        div.className = 'synthesis-card bg-white rounded-2xl shadow-lg mb-6 overflow-hidden border border-gray-100 hover:border-gray-200 transition-all duration-300';
        div.innerHTML = `
            <div class="bg-gradient-to-br ${patternColor} rounded-xl p-8 text-white relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div class="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                <div class="relative z-10">
                    <div class="flex items-start justify-between mb-6">
                        <div class="flex items-center">
                            <div class="w-16 h-16 bg-white/25 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-6 flex-shrink-0 shadow-lg">
                                <i class="${patternIcon} text-2xl"></i>
                            </div>
                            <div>
                                <h4 class="font-bold text-2xl mb-2 leading-tight">${item.outcome}</h4>
                                <div class="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                                    <i class="fas fa-cogs mr-2 text-sm"></i>
                                    <span class="font-semibold text-sm">${item.pattern}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="p-6">
                <p class="text-gray-700 mb-6 leading-relaxed text-base">${item.description}</p>
                
                <div class="bg-gradient-to-r from-emerald-50 to-blue-50 p-5 rounded-xl border border-emerald-200">
                    <div class="flex items-center mb-3">
                        <i class="fas fa-lightbulb text-emerald-600 mr-2"></i>
                        <h6 class="font-bold text-sm text-emerald-800">Real-world Examples</h6>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        ${item.examples.map(ex => `
                            <span class="bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-sm font-medium px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow">
                                ${ex}
                            </span>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        synthesisContainer.appendChild(div);
    });

    // Initial render
    renderProblems();

    // Handle window resize for accordion height recalculation
    window.addEventListener('resize', () => {
        // Recalculate open accordion heights on window resize
        frameworkAccordion.querySelectorAll('.accordion-content.open').forEach(content => {
            content.style.maxHeight = content.scrollHeight + "px";
        });
    });
});
