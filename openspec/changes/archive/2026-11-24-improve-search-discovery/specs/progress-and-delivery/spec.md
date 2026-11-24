## ADDED Requirements

### Requirement: Public course discovery
The published homepage SHALL include a plain HTML course overview, a canonical URL, a page title and description, structured application metadata, and social sharing metadata. The project SHALL publish an XML sitemap containing the canonical homepage URL.

#### Scenario: Read the homepage with scripts disabled
- **WHEN** a visitor or crawler fetches the homepage without running JavaScript
- **THEN** the course overview and discovery metadata are available in the HTML

#### Scenario: Enter a lesson from the homepage
- **WHEN** a new visitor opens a lesson link from the public overview and creates a local profile
- **THEN** the app opens the selected lesson
