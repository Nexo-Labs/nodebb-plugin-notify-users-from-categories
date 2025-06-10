<div class="acp-page-container">
	<!-- IMPORT admin/partials/settings/header.tpl -->

	<div class="row m-0">
		<div id="spy-container" class="col-12  px-0 mb-4" tabindex="0">
			<form class="form category-notifications-settings">
				<div class="mb-3">
					<label class="form-label" for="notificationSetting">Notification Setting</label>
					<select id="notificationSetting" name="type" class="form-select" >
						<option value="email">Send Email Only</option>
						<option value="notification">Send Notification Only</option>
						<option value="both">Send Both Email and Notification</option>
					</select>
				</div>
				<div class="mb-3">
					<label class="form-label" for="groups-to-notify">Groups to notify</label>
					<select id="groups-to-notify" name="groups-to-notify" class="form-select" multiple size="8">
						{{{ each groups }}}
						<option value="{./displayName}">{./displayName}</option>
						{{{ end }}}
					</select>
					<p class="form-text">Selecciona los grupos que deben recibir notificaciones</p>
				</div>
				<div class="mb-3">
					<label class="form-label" for="categories-to-notify">Categories to notify</label>
					<select id="categories-to-notify" name="categories-to-notify" class="form-select" multiple size="8">
						{{{ each categories }}}
						<option value="{./cid}" data-name="{./name}">{./level}{./name}</option>
						{{{ end }}}
					</select>
					<p class="form-text">Selecciona las categorías que activarán las notificaciones</p>
				</div>
			</form>
		</div>

		<!-- IMPORT admin/partials/settings/toc.tpl -->
	</div>
</div>
