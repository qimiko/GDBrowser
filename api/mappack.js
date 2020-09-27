const request = require('request')
const util = require('util')

// i have no idea how this works
// in a sense the goal is to return an array such that:
// "name": [level,level,level,diff]
module.exports = async (app, use_verify) => {
	let pages = 1;

	if (use_verify === undefined) {
		use_verify = false;
	}

	if (!use_verify) {
		pages = Math.ceil(await getPackCount()/10);
	}

	let mapPacks = []
	for (var i = 0; i < pages; i++) {
		mapPacks = mapPacks.concat(await getListOfPacks(app, i, use_verify));
	}
	return mapPacks
}

async function getListOfPacks(app, page, use_verify) {
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

	let form = { page };
	if (use_verify) {
		form['isVerify'] = 1;
	}

	const response = await requestPromise('https://absolllute.com/gdps/gdapi/getGJMapPacks.php', {
		form
	});
	if (response.err || !response.body || response.body == '-1' || response.body == '###10:10:10#-1') {
		return "-1"
	}
	let packArray = []
	for (const pack of response.body.split('|')) {
		const result = app.parseResponse(pack, ':');
		const levels = result['3'].split(',');
		const diff = difficulty[result['6']];

		const pack_obj = {
			id: parseInt(result['1']),
			levels,
			difficulty: diff,
		}

		if ('2' in result) {
			pack_obj["name"] = result['2'];
		}

		if ('7' in result) {
			const colors = result['7'].split(',');

			const color_result = {
				r: colors[0],
				g: colors[1],
				b: colors[2]
			}

			pack_obj["color"] = color_result;
		}

		packArray.push(pack_obj);
	}
	return packArray
}

async function getPackCount() {
	const requestPromise = util.promisify(request.post);
	const response = await requestPromise('https://absolllute.com/gdps/gdapi/getGJMapPacks.php', {
		form: {
			page: 0,
			isVerify: 1
		}
	});
	if (response.err || !response.body || response.body == '-1' || response.body == '###10:10:10#-1') {
		return "-1"
	}
	const footer = response.body.split('#')[1];
	return footer.split(':')[0]
}