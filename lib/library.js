'use strict';

const routes = require('./routes');
const categoryNotification = require('./categoryNotifications');

const library = module.exports;

library.init = async (params) => {
	routes.init(params);
};

library.adminMenu = function (menu) {
	menu.plugins.push({
		route: '/plugins/category-notifications',
		icon: 'fa-pencil',
		name: 'Category Notifications',
	});
	return menu;
};

library.onTopicPost = function (data) {
	categoryNotification.onTopicPost(data.topic);
};

library.onTopicReply = function (data) {
	categoryNotification.onTopicReply(data.post);
};

// onUserDelete eliminado - ya no se maneja suscripción de usuarios


