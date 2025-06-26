## **mock-box - Open Source API Mock Server Generator**

**mock-box** is a transparent, minimal, and hackable tool for generating mock servers from API specifications.
It enables developers and planners to visually define API contracts and export runnable mock server executables, with no cloud lock-in or proprietary barriers.

mock-box emphasizes local-first development, simplicity, and community-driven extensibility.

---

## **README.md**

````markdown
# mock-box

Open Source API Mock Server Generator - Simple. Transparent. Portable.

mock-box is a desktop tool that lets you define RESTful API specifications through an intuitive interface and instantly generate executable mock servers.  
It provides a lightweight, local-first alternative to proprietary mock platforms, ideal for rapid prototyping, testing, and frontend-backend decoupling.

## Features

- Cross-platform desktop application (Electron)
- One-click generation of runnable mock servers (Go-based, compiled)
- Outputs standalone executables for Windows, macOS, and Linux
- Visual editor for API endpoints, request/response definitions
- No runtime dependencies; executables run independently
- Designed for developers, planners, testers, and technical teams
- Minimal, hackable, and community-extensible architecture
- Fully offline operation; no external services required

## Installation

Download pre-built binaries from the [Releases](https://github.com/your-org/mock-box/releases) page.

To build from source:

### Requirements

- Go 1.22 or later
- Node.js (for development environment)
- Electron

### Build Steps

```bash
git clone https://github.com/your-org/mock-box.git
cd mock-box
npm install
npm run dev
````

## Usage

1. Launch mock-box
2. Define API specifications via the visual interface
3. Export a compiled mock server executable
4. Run the executable locally to simulate the API

Example:

```bash
./my-mock-server
Server running at http://localhost:8080
```

## Philosophy

* Open source by default
* Local-first, offline capable
* Minimal dependencies
* Transparent, extensible design
* Avoid vendor lock-in

mock-box aims to empower developers with accessible tools for API prototyping, without complex environments or closed ecosystems.

## Technical Stack

* Electron (Desktop UI)
* Go (Mock server runtime)
* HTML/CSS/JavaScript (Frontend)

## License

mock-box is released under the MIT License. See [LICENSE](LICENSE) for details.

## Contributing

Community contributions are welcome. To report issues, request features, or submit pull requests, please use the GitHub repository.

mock-box is developed in the spirit of open collaboration. Suggestions, improvements, and forks are encouraged.
