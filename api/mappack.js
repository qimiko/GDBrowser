const request = require('request')
const util = require('util')

// i have no idea how this works
// in a sense the goal is to return an array such that:
// "name": [level,level,level,diff]
module.exports = async (app) => {
	const pages = Math.ceil(await getPackCount()/10);
	let mapPacks = {}
	for (var i = 0; i < pages; i++) {
		mapPacks = Object.assign({}, mapPacks, await getListOfPacks(app, i));
	}
	return mapPacks
}

async function getListOfPacks(app, page) {
	let difficulty = {
		0: 'unrated',
		1: 'easy',
		2: 'normal',
		3: 'hard',
		4: 'harder',
		5: 'insane',
		6: 'demon',
	}
	const requestPromise = util.promisify(request.post);
	const response = await requestPromise('https://absolllute.com/gdps/gdapi/getGJMapPacks.php', {
		form: {
			page: page
		}
	});
	if (response.err || !response.body || response.body == '-1' || response.body == '###10:10:10#-1') {
		return "-1"
	}
	let packArray = {}
	for (const pack of response.body.split('|')) {
		const result = app.parseResponse(pack, ':');
		const levels = result['3'].split(',');
		const diff = difficulty[result['6']];
		levels.push(diff);
		packArray[result['2']] = levels;
	}
	return packArray
}

async function getPackCount() {
	const requestPromise = util.promisify(request.post);
	const response = await requestPromise('https://absolllute.com/gdps/gdapi/getGJMapPacks.php', {
		form: {
			page: 0
		}
	});
	if (response.err || !response.body || response.body == '-1' || response.body == '###10:10:10#-1') {
		return "-1"
	}
	const footer = response.body.split('#')[1];
	return footer.split(':')[0]
}