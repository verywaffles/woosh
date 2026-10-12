# Woosh

**A social platform built to bring people together.**

Woosh is an independent social platform built with a focus on a clean experience, community, and making it easier to connect with people. This repository contains the frontend and backend source code used to develop Woosh.

🌐 **Live website:** [wooshio.web.app](https://wooshio.web.app)  
📦 **Source code:** [github.com/verywaffles/woosh](https://github.com/verywaffles/woosh)

---

## About

Woosh is a project built independently by its creator. The goal is to build a social platform that feels straightforward to use and gives people a place to connect.

This repository is public so people can explore the code, learn how the project works, report issues, and contribute improvements.

### Project principles

- **Open source:** The source code is available for public inspection.
- **Community:** Contributions, constructive feedback, and ideas are welcome.
- **Transparency:** Anyone can examine the published code and report potential problems.
- **Continuous improvement:** Woosh is an evolving project, and features may change as development continues.

> Open source makes the published code inspectable. It is not, by itself, a guarantee of security or privacy.

## Tech stack

Woosh uses the following technologies in its current implementation:

- **Frontend:** React
- **Build tool:** Vite
- **Backend:** Node.js and Express
- **Database:** SQLite, through `better-sqlite3`
- **Authentication utilities:** `bcryptjs` and `jsonwebtoken`
- **Hosting:** Firebase Hosting for the frontend, with a separately hosted backend

See the frontend and backend `package.json` files for dependency details.

## Repository structure

```text
woosh/
├── public/                 # Static frontend assets
├── src/                    # React application source
│   ├── assets/             # Application assets
│   ├── App.jsx             # Main application
│   ├── App.css             # Application styles
│   ├── index.css           # Global styles
│   └── main.jsx            # Frontend entry point
├── server/                 # Backend source
│   ├── server.js           # Express server
│   ├── database.js         # Database operations
│   ├── package.json        # Backend dependencies
│   └── package-lock.json   # Locked backend dependencies
├── index.html
├── package.json            # Frontend dependencies and scripts
├── firebase.json
└── README.md
```

## Getting started

### Requirements

Install the following before developing locally:

- [Node.js](https://nodejs.org/)
- npm, included with Node.js
- Git

### 1. Clone the repository

```bash
git clone https://github.com/verywaffles/woosh.git
cd woosh
```

### 2. Set up the frontend

From the repository root:

```bash
npm install
npm run dev
```

Vite will print the local development URL in your terminal.

### 3. Set up the backend

Open a second terminal:

```bash
cd woosh/server
npm install
npm start
```

**Configuration note:** The production backend may require environment variables, database configuration, or other settings before it can run locally. Review `server.js` and `database.js` before starting it. Do not use production credentials or a production database for local development.

If the frontend is configured to use the deployed API, local frontend development may still send requests to that API until you change the development configuration.

## Contributing

Contributions and suggestions are welcome!

1. Fork the repository.
2. Create a branch for your change.
3. Make your changes and test them.
4. Open a pull request explaining what you changed and why.

For bugs or feature ideas, open a GitHub issue with enough detail to reproduce the problem or understand the suggestion.

Please keep contributions focused, avoid committing secrets or personal data, and never include database files, credentials, or production backups in pull requests.

## Security and privacy

If you find a potential security vulnerability, please report it responsibly to the project maintainer rather than publicly posting sensitive exploit details or personal information.

Please remember:

- Never commit passwords, API tokens, private keys, or environment files.
- Never commit SQLite databases or database backups.
- Never include real users' personal information in issues, commits, or test data.
- Review changes carefully before deploying them to production.

Making the source public allows inspection of the code, but does not automatically make the deployed service secure. Security also depends on server configuration, access controls, database permissions, and how the application is operated.

## Project status

Woosh is under active development. Features, APIs, and implementation details may change.

The live website and the code in this repository may not always be identical, because production deployments are managed separately.

## License

A license has not yet been specified. Until a license is added, the public availability of this repository does not automatically grant permission to reuse, modify, or redistribute its code.

---

**Built independently. Open to feedback. Always improving.**
