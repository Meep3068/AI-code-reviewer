# code-analyzer

A Visual Studio Code extension that analyzes code using an external analysis service.
-NO LONGER WORKS-

## Features

- **Analyze Code**: With a single command, analyze all the code files in your current workspace and receive feedback.
- **Local Analysis Results**: All analysis results are stored locally in a `code_analyzer` directory, providing you with a clear overview of the feedback for each file.

## Getting Started

### Installation

1. Download the `FinishedCoder.vsix` file.
2. Open Visual Studio Code.
3. Navigate to Extensions by clicking on the square icon on the sidebar or pressing `Ctrl+Shift+X`.
4. Click on the `...` (More Actions) button in the top right corner of the Extensions view.
5. Select `Install from VSIX...`.
6. Navigate to and select the `code-analyzer.vsix` file to install the extension.

### Usage

1. Open your workspace in VS Code.
2. Press `Ctrl+Shift+P` to open the command palette.
3. Type "Analyze Code" and select the corresponding command.
4. The extension will analyze your code and store the results in a `code_analyzer` directory.

## Known Limitations

- The extension currently supports specific code file extensions. Ensure your files are supported.
- Hidden directories (starting with a dot, like `.git`) are ignored during the analysis.
