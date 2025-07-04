# LLM-HTML

LLM-HTML is a web-based application designed to interact with Large Language Models (LLMs). The whole app is contained within a single HTML file. It supports llama.cpp as the server endpoint and other openai compatible APIs. It provides a user-friendly interface for creating and managing chats, configuring multiple LLM settings, and attaching code files via drag-and-drop. The application is built using React, TypeScript, and Bootstrap, and it is optimized for both desktop and mobile devices.

## Features

- **Chat Management**: Create, edit, and delete chats.
- **Configuration Presets**: Manage and configure LLM settings. Use different APIs.
- **File Attachment**: Attach code files via drag-and-drop.
- **Responsive Design**: Optimized for both desktop and mobile devices.
- **Markdown Rendering**: Supports markdown rendering for chat messages.
- **Real-time Updates**: Real-time updates for chat messages and configurations.

## Usage

Download the latest HTML file release from this url by saving the page ([https://tar-alex.github.io/llm-html/](https://tar-alex.github.io/llm-html/))

## Building

1. Install the dependencies

```bash
npm install
```

## Running the Dev Application

1. Start the development server:

```bash
npm run dev
```

2. Open your browser and navigate to `http://localhost:5173`.

## Building the Release

To build the release as a single HTML file, run:

```bash
npm run build
```

The build HTML file will be stored in the `dist` directory.

you can optionally serve it after building with:

```bash
npm run preview
```

or to have it exposed on the network run:

```bash
npm run preview -- --host
```

## Contributing

Contributions are welcome. Please open an issue or submit a pull request.

## License

This project is licensed under the BSD3 Liscense. See the [LICENSE](LICENSE) file for details.