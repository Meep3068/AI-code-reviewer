const vscode = require('vscode');
const path = require('path');
const fs = require('fs').promises;
const http = require('http');
const querystring = require('querystring');

// Helper functions

function getAnalyzerPaths() {
    const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    return {
        rootPath,
        analyzerPath: path.join(rootPath, 'code_analyzer'),
        logFilePath: path.join(rootPath, 'code_analyzer', 'activation_log.txt')
    };
}

function createAnalyzerDirectory(analyzerPath) {
    if (!fs.existsSync(analyzerPath)) {
        fs.mkdirSync(analyzerPath, { recursive: true });
    }
}

function logActivation(analyzerPath, message) {
    const logFilePath = path.join(analyzerPath, 'activation_log.txt');
    fs.writeFileSync(logFilePath, message);
}

async function analyzeAndCopyWorkspace(rootPath, analyzerPath, codeExtensions, api_key) {
    const entries = fs.readdirSync(rootPath, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(rootPath, entry.name);

		if (entry.name.startsWith('.')) {
			continue;
		}
		
        let destPath;

        if (entry.isDirectory()) {
			const baseName = path.basename(entry.name, path.extname(entry.name));
			destPath = path.join(analyzerPath, `${baseName}_${path.extname(entry.name).slice(1)}.txt`);
            if (!srcPath.includes(analyzerPath)) {
                fs.mkdirSync(destPath, { recursive: true });
                await analyzeAndCopyWorkspace(srcPath, destPath, codeExtensions, api_key);
            }
        } else if (codeExtensions.includes(path.extname(entry.name))) {
            destPath = path.join(analyzerPath, `${entry.name}_${path.extname(entry.name).slice(1)}.txt`);
            
            // Analyze the code
            const code = fs.readFileSync(srcPath, 'utf8');
            const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
            const postData = 
                `--${boundary}\r\n` +
                'Content-Disposition: form-data; name="code_file"; filename="code.txt"\r\n' +
                'Content-Type: text/plain\r\n\r\n' +
                code + '\r\n' +
                `--${boundary}--`;

            const requestOptions = {
                hostname: '45.76.31.114',
                port: 5000,
                path: '/analyze',
                method: 'POST',
                headers: {
                    'API-Key': api_key,
                    'Content-Type': `multipart/form-data; boundary=${boundary}`,
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            await new Promise((resolve, reject) => {
                const request = http.request(requestOptions, response => {
                    let responseData = '';
                    response.on('data', chunk => responseData += chunk);
                    response.on('end', () => {
                        if (response.statusCode === 200) {
                            const analysis = JSON.parse(responseData).analysis;
                            fs.writeFileSync(destPath, analysis);
                        } else {
                            const error = JSON.parse(responseData).error;
                            fs.writeFileSync(destPath, `Error: ${error}`);
                        }
                        resolve();
                    });
                });

                request.on('error', error => {
                    fs.writeFileSync(destPath, `Error: ${error.message}`);
                    resolve();
                });

                request.write(postData);
                request.end();
            });
        }
    }
}

async function myCustomAsyncFunction(rootPath, analyzerPath) {
    const filePath = path.join(rootPath, 'example.txt');

    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        
        
        await new Promise(resolve => setTimeout(resolve, 1000));

        const logMessage = `Read file content: ${fileContent}`;
        logActivation(analyzerPath, logMessage);

        vscode.window.showInformationMessage('Custom async function completed.');
    } catch (error) {
        vscode.window.showErrorMessage('Error in custom async function: ' + error.message);
    }
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    // Register the command
    let disposable = vscode.commands.registerCommand('code-analyzer.analyze-code', async function () {
        try {
            // Check if a workspace is open
            if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
                vscode.window.showErrorMessage('No workspace is open. Please open a workspace first.');
                return;
            }

            // Ask the user for the API key
            const api_key = await vscode.window.showInputBox({
                prompt: 'Please enter your API key for code analysis',
                password: true,
                ignoreFocusOut: true
            });

            if (!api_key) {
                vscode.window.showErrorMessage('API key is required for code analysis.');
                return;
            }

            // Inform the user about the data being sent
            const userConsent = await vscode.window.showWarningMessage(
                'This will send your code files to an external server for analysis. Do you want to continue?', 
                { modal: true },
                'Continue'
            );

            if (userConsent !== 'Continue') {
                return;
            }

            const { rootPath, analyzerPath } = getAnalyzerPaths();
            
            createAnalyzerDirectory(analyzerPath);
            
            logActivation(analyzerPath, 'Your extension "code-analyzer" is analyzing the code.');

            const codeExtensions = ['.js', '.ts', '.py', '.java', '.c', '.cpp', '.go', '.rb', '.php'];

            try {
                await analyzeAndCopyWorkspace(rootPath, analyzerPath, codeExtensions, api_key);
                await myCustomAsyncFunction(rootPath, analyzerPath); 
                vscode.window.showInformationMessage('Workspace analyzed and recreated in code_analyzer directory.');
            } catch (err) {
                vscode.window.showErrorMessage('Failed to analyze and recreate workspace: ' + err.message);
            }
        } catch (error) {
            // Handle any unexpected errors during activation
            vscode.window.showErrorMessage('Error during activation: ' + error.message);
        }
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
