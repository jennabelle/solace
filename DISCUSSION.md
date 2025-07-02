Improvements I would make if I had more time:

Database Optimization

- Add database indices for fast lookups
- This is text-based search on hundreds of thousands of advocates to search from, so I would further optimize search by using ElasticSearch or PostGRES full-text search capabilities

Backend

- Ensure proper input validation to prevent XSS attacks, etc
- Consider adding a cache like redis to optimize search

Frontend

- Add hover state and "cursor:pointer" to each advocate card
- Add accessibility features e.g. aria labels for screen readers to make it easy for disabled folks
- I initially went with debounce to make it more performant, but now that I think about it more, to better accomodate folks with disabilities, a clear CTA "Submit" button is probably more user friendly
- Add internationalization to keep commonly used strings DRY, also for easier translation in the future
- Add unit tests with React Testing Library
- Ensure proper input validation to prevent XSS attacks, etc

Repository

- Add Typescript
- Streamline repository folders e.g., separate folders to hold helper functions, reusable dumb components
- Add GitHub dependabots to automate security vulnerability detection and resolution
