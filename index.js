import * as fs from 'node:fs';
import { execSync, exec } from 'node:child_process';
import * as chromeLauncher from "chrome-launcher";
import * as path from "path";
import lighthouse from "lighthouse";

function buildProject(project) {
    console.log('Building project: ', project.name);
    runCommand('pnpm i', project.path);
    if (project.build) {
        runCommand(project.build, project.path);
    } else {
        runCommand('pnpm build', project.path);
    }
}

function runCommand(command, cwd) {
    console.log(command);
    execSync(command, { stdio: 'inherit', cwd });
}

function deployHtml(project, port) {
    let serve;
    buildProject(project);
    if (project.preview) {
        const cmd = project.preview;
        console.log(cmd);
        serve = exec(`${cmd} --port ${port}`,{cwd:project.path} , (error) => {
            throw error;
        });
    } else {
        const cmd = `"node_modules/.bin/serve" ./${project.path}/${project.dist ? project.dist : 'dist'} -l ${port}`;
        console.log(cmd);
        serve = exec(cmd , (error) => {
            throw error;
        });
    }
    return serve;
}

async function runLighthouse(url) {
    const debuggingPort = 9999;
    const options = {
        chromeFlags: [
            "--headless",
            "--no-sandbox",
            "--no-first-run",
            "--enable-automation",
            "--disable-infobars",
            "--disable-background-networking",
            "--disable-background-timer-throttling",
            "--disable-cache",
            "--disable-translate",
            "--disable-sync",
            "--disable-extensions",
            "--disable-default-apps",
            "--window-size=1200,800",
            "--remote-debugging-port=" + debuggingPort,
        ],
        onlyCategories: ["performance"],
        port: debuggingPort,
        logLevel: "info",
    };
    const chrome = await chromeLauncher.launch(options);
    let results = null;
    try {
        results = await lighthouse(url, options);
        await chrome.kill();
    } catch (error) {
        console.log("error running lighthouse", error);
        await chrome.kill();
        throw error;
    }
    return results.lhr;
}

async function main() {
    process.stdout.setEncoding('utf-8');
    const projects = JSON.parse(fs.readFileSync('projectList.json'));
    let port = 5000;
    for (const project of projects) {
        if (project.name) {
            let serve = deployHtml(project, port);            
            const result = await runLighthouse(`http://localhost:${port}/`);
            if (!fs.existsSync(`./results/${project.name}.json`)) {
                fs.mkdirSync(path.dirname(`./results/${project.name}.json`), {recursive: true})
            }
            fs.writeFileSync(`./results/${project.name}.json`, JSON.stringify(result));
            if (serve) {
                serve.kill('SIGINT');
            }
            port++;
        }
    }
}

main();