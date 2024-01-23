import * as fs from 'node:fs';
import { execSync } from 'node:child_process';

function buildProject(project) {
    console.log('Building project: ', project.name);
    runCommand('pnpm i', project.name);
    if (project.build) {
        runCommand(project.build, project.name);
    } else {
        runCommand('pnpm build', project.name);
    }
}

function runCommand(command, cwd) {
    console.log(command);
    execSync(command, { stdio: 'inherit', cwd });
}

function main() {
    const projects = JSON.parse(fs.readFileSync('projectList.json'));
    for (const project of projects) {
        console.log(project);
        buildProject(project);
    }
}

main();