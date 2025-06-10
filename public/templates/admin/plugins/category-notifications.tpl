
<div class="acp-page-container">
	<!-- IMPORT admin/partials/settings/header.tpl -->

	<div class="row m-0">
		<div id="spy-container" class="col-12  px-0 mb-4" tabindex="0">
			<form class="form category-notifications-settings">
				<div class="">
					<label class="form-label" for="notificationSetting">Notification Setting</label>
					<select id="notificationSetting" name="type" class="form-select" >
						<option value="email">Send Email Only</option>
						<option value="notification">Send Notification Only</option>
						<option value="both">Send Both Email and Notification</option>
					</select>
				</div>
				<div class="mb-3">
					<label class="form-label" for="groups-to-notify">Groups to notify</label>
					<input type="text" id="groups-to-notify" name="groups-to-notify" title="Groups to notify" class="form-control" placeholder="Groups to notify">
				</div>
				<div class="mb-3">
					<label class="form-label" for="categories-to-notify">Categories to notify</label>
					<input type="text" id="categories-to-notify" name="categories-to-notify" title="Categories to notify" class="form-control" placeholder="Categories to notify">
				</div>
			</form>
		</div>

		<!-- IMPORT admin/partials/settings/toc.tpl -->
	</div>
</div>
