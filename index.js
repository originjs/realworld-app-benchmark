import * as fs from 'node:fs';
import { execSync, exec } from 'node:child_process';
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";
import { report } from './report.js';

function install(project) {
    console.log('Installing: ', project.name);
    if (project.install) {
        runCommand(project.install, project.path);
    } else {
        runCommand('pnpm i', project.path);
    }
}

function build(project) {
    console.log('Building project: ', project.name);
    if (project.build) {
        runCommand(project.build, project.path);
    } else {
        runCommand('pnpm build', project.path);
    }
}

function preview(project, port) {
    let serve;
    if (project.preview) {
        const cmd = project.preview;
        console.log(cmd);
        serve = exec(`${cmd} --port ${port}`, { cwd: project.path }, (error) => {
            throw error;
        });
    } else {
        const cmd = `"node_modules/.bin/serve" ./${project.path}/${project.dist ? project.dist : 'dist'} -l ${port}`;
        console.log(cmd);
        serve = exec(cmd, (error) => {
            throw error;
        });
    }
    return serve;
}

function runCommand(command, cwd) {
    console.log(command);
    execSync(command, { stdio: 'inherit', cwd });
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
    process.stdout.setEncoding("utf-8");
    const args = process.argv.length <= 2 ? [] : process.argv.slice(2, process.argv.length);
    const projects = JSON.parse(fs.readFileSync("projectList.json"));
    // install
    if (args.length == 0 || args.includes("--all") || args.includes("--install")) {
        for (const project of projects) {
            if (project.name) {
                install(project);
            }
        }
    }
    // build
    if (args.length == 0 || args.includes("--all") || args.includes("--build")) {
        for (const project of projects) {
            if (project.name) {
                build(project);
            }
        }
    }
    // lighthouse benchmark
    if (args.length == 0 || args.includes("--all") || args.includes("--bench")) {
        let port = 5000;
        if (!fs.existsSync('./results')) {
            fs.mkdirSync('./results');
        }
        for (const project of projects) {
            if (project.name) {
                console.log(`Start testing ${project.name}...`)
                let serve = preview(project, port);
                const result = await runLighthouse(`http://localhost:${port}/`);
                if (args.includes("--upload")) {
                    report(project.name, result);
                } else {
                    fs.writeFileSync(`./results/${project.name}.json`, JSON.stringify(result));
                }
                if (serve) {
                    serve.kill('SIGINT');
                }
                port++;
            }
        }
        if (!args.includes("--upload")) {
            sortResult('./results');
        }
    }
    // generate result

}

main();