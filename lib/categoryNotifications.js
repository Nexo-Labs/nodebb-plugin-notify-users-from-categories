'use strict';

const async = require('async');

const nconf = require.main.require('nconf');
const db = require.main.require('./src/database');
const meta = require.main.require('./src/meta');
const emailer = require.main.require('./src/emailer');
const notifications = require.main.require('./src/notifications');
const user = require.main.require('./src/user');
const categories = require.main.require('./src/categories');
const translator = require.main.require('./src/translator');
const groups = require.main.require('./src/groups');
const winston = require.main.require('winston');

const categoryNotifications = module.exports;

async function getSubscribers(cid, exceptUid) {
	winston.verbose(`[category-notifications] Getting subscribers for cid: ${cid}, exceptUid: ${exceptUid}`);
	const settings = await meta.settings.get('category-notifications');
	
	const configuredCategories = settings['categories-to-notify'];
	winston.verbose(`[category-notifications] Configured categories: ${JSON.stringify(configuredCategories)}`);
	if (configuredCategories && configuredCategories.length > 0) {
		let categoryIds;
		if (Array.isArray(configuredCategories)) {
			categoryIds = configuredCategories.map(id => parseInt(id, 10));
		} else if (typeof configuredCategories === 'string') {
			try {
				const parsed = JSON.parse(configuredCategories);
				categoryIds = Array.isArray(parsed) ? parsed.map(id => parseInt(id, 10)) : configuredCategories.split(',').map(id => parseInt(id.trim(), 10));
			} catch (e) {
				categoryIds = configuredCategories.split(',').map(id => parseInt(id.trim(), 10));
			}
		}
		winston.verbose(`[category-notifications] Category ids: ${JSON.stringify(categoryIds)}`);
		if (!categoryIds.includes(parseInt(cid, 10))) {
			winston.verbose(`[category-notifications] Category ${cid} not found in configured categories`);
			return [];
		}
	}
	
	const configuredGroups = settings['groups-to-notify'];
	winston.verbose(`[category-notifications] Configured groups: ${JSON.stringify(configuredGroups)}`);
	let allUids;
	if (!configuredGroups || configuredGroups.length === 0) {
		allUids = await user.getUidsFromSet('users:joindate', 0, -1);
	} else {
		let groupNames;
		if (Array.isArray(configuredGroups)) {
			groupNames = configuredGroups;
		} else if (typeof configuredGroups === 'string') {
			try {
				const parsed = JSON.parse(configuredGroups);
				groupNames = Array.isArray(parsed) ? parsed : configuredGroups.split(',').map(name => name.trim());
			} catch (e) {
				groupNames = configuredGroups.split(',').map(name => name.trim());
			}
		}
		winston.verbose(`[category-notifications] Group names: ${JSON.stringify(groupNames)}`);
		const groupMemberArrays = await Promise.all(
			groupNames.map(groupName => groups.getMembers(groupName, 0, -1))
		);
		winston.verbose(`[category-notifications] Group member arrays: ${JSON.stringify(groupMemberArrays)}`);
		allUids = [...new Set(groupMemberArrays.flat())];
		winston.verbose(`[category-notifications] All uids: ${JSON.stringify(allUids)}`);
	}
	
	return allUids.filter(uid => parseInt(uid, 10) !== parseInt(exceptUid, 10));
}

categoryNotifications.onTopicPost = async function (topic) {
	const settings = await meta.settings.get('category-notifications');
	settings.type = settings.type || 'email';
	winston.verbose(`[category-notifications] Sending topic notification, type: ${settings.type}`);

	if (settings.type === 'notification') {
		await sendTopicNotification(topic);
	} else if (settings.type === 'email') {
		await sendTopicEmail(topic);
	} else if (settings.type === 'both') {
		await Promise.all([
			sendTopicEmail(topic),
			sendTopicNotification(topic),
		]);
	}
};

categoryNotifications.onTopicReply = async function (post) {
	const settings = await meta.settings.get('category-notifications');
	settings.type = settings.type || 'email';
	winston.verbose(`[category-notifications] Sending post notification, type: ${settings.type}`);

	if (settings.type === 'notification') {
		await sendPostNotification(post);
	} else if (settings.type === 'email') {
		await sendPostEmail(post);
	} else if (settings.type === 'both') {
		await Promise.all([
			sendPostEmail(post),
			sendPostNotification(post),
		]);
	}
};

async function sendTopicNotification(topic) {
	const uids = await getSubscribers(topic.cid, topic.user.uid);
	if (!uids.length) {
		return;
	}

	const notification = await notifications.create({
		bodyShort: translator.compile('notifications:user-posted-topic', topic.user.displayname, topic.title),
		bodyLong: topic.mainPost.content,
		pid: topic.mainPost.pid,
		path: `/post/${topic.mainPost.pid}`,
		nid: `tid:${topic.tid}:uid:${topic.uid}`,
		tid: topic.tid,
		from: topic.uid,
	});
	notifications.push(notification, uids);
}

async function sendTopicEmail(topic) {
	let uids = await getSubscribers(topic.cid, topic.user.uid);
	uids = await user.blocks.filterUids(topic.user.uid, uids);
	if (!uids.length) {
		return;
	}

	const tpl = 'categoryNotifications_topic';
	const params = {
		subject: `[[categorynotifications:new-topic-in, ${topic.category.name}]]`,
		site_title: meta.config.title || 'NodeBB',
		url: nconf.get('url'),
		title: topic.title,
		topicSlug: topic.slug,
		category: {
			name: topic.category.name,
			slug: topic.category.slug,
		},
		content: topic.mainPost.content,
		user: {
			slug: topic.user.userslug,
			name: topic.user.username,
			picture: topic.user.picture,
		},
	};
	await sendEmailToUids(uids, tpl, params);
}

async function sendPostNotification(post) {
	const uids = await getSubscribers(post.topic.cid, post.user.uid);
	if (!uids.length) {
		return;
	}

	const notification = await notifications.create({
		bodyShort: translator.compile('notifications:user-posted-to', post.user.displayname, post.topic.title),
		bodyLong: post.content,
		pid: post.pid,
		path: `/post/${post.pid}`,
		nid: `tid:${post.topic.tid}:pid:${post.pid}:uid:${post.uid}`,
		tid: post.topic.tid,
		from: post.uid,
	});
	notifications.push(notification, uids);
}

async function sendPostEmail(post) {
	let uids = await getSubscribers(post.topic.cid, post.user.uid);
	uids = await user.blocks.filterUids(post.user.uid, uids);
	winston.verbose(`[category-notifications] Sending post email for: ${post.topic.title}, uids: ${JSON.stringify(uids)}`);
	if (!uids.length) {
		return;
	}
	const category = await categories.getCategoryFields(post.topic.cid, ['name', 'slug']);
	const tpl = 'categoryNotifications_post';
	const params = {
		subject: `[[categorynotifications:new-reply-in, ${post.topic.title}]]`,
		site_title: meta.config.title || 'NodeBB',
		url: nconf.get('url'),
		title: post.topic.title,
		topicSlug: post.topic.slug,
		category: category,
		content: post.content,
		user: {
			slug: post.user.userslug,
			name: post.user.username,
			picture: post.user.picture,
		},
		pid: post.pid,
	};
	await sendEmailToUids(uids, tpl, params);
}

async function sendEmailToUids(uids, tpl, params) {
	let errorLogged = false;
	winston.verbose(`[category-notifications] Sending email to ${uids.length} users with template: ${tpl}`);
	await async.eachLimit(uids, 50, async (uid) => {
		await emailer.send(tpl, uid, params).catch((err) => {
			if (!errorLogged) {
				console.error(err.stack);
				errorLogged = true;
			}
		});
	});
}
