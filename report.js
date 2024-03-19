import { platform as _platform } from "os";
import axios from "axios";

const techStack = "前端框架";
const REPORT_URL='http://8.134.178.105:3000';
const url = REPORT_URL;
const BOOST_PERFORMANCE = Object.freeze([
	'first-contentful-paint',
	'largest-contentful-paint',
	'total-blocking-time',
	'cumulative-layout-shift',
	'speed-index'])

export async function report(project, jsonData) {
	const patchId = await getPatchId();
	const res = dealdata(project, jsonData, patchId.toString());
	await postData(res);
}

async function getPatchId() {
	const { data: patchId } = await axios.post(
		`${url}/sync/benchmark/getPatchId`,
		{},
	);
	console.log("patchId: ", patchId);
	return patchId.toString();
}

function dealdata(projectName, jsonData, patchId) {
	const res = [];
	for (let bench of BOOST_PERFORMANCE) {
		res.push({
				projectName,
				benchmark: bench,
				techStack,
				rawValue: jsonData.audits[bench].numericValue,
				patchId,
				platform: _platform(),
			})
	}
	return res;
}

async function postData(res) {
	for (let data of res) {
		try {
			console.log(data);
			const response = await axios.post(`${url}/sync/benchmark`, data);
			console.log(response.data);
		} catch (error) {
			console.error(error);
		}
	}
}