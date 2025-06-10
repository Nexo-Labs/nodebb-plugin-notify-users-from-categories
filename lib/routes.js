'use strict';

const routes = module.exports;

routes.init = function (params) {
	const routesHelpers = require.main.require('./src/routes/helpers');
	const groups = require.main.require('./src/groups');
	const categories = require.main.require('./src/categories');
	
	routesHelpers.setupAdminPageRoute(params.router, '/admin/plugins/category-notifications', async (req, res) => {
		const [allGroups, allCategories] = await Promise.all([
			groups.getNonPrivilegeGroups('groups:createtime', 0, -1),
			categories.buildForSelect(req.uid, 'find', ['disabled', 'link']),
		]);
		
		res.render('admin/plugins/category-notifications', {
			title: 'Category Notifications',
			groups: allGroups,
			categories: allCategories,
		});
	});
};

