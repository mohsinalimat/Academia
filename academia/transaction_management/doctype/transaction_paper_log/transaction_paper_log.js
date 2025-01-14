// Copyright (c) 2024, SanU and contributors
// For license information, please see license.txt

frappe.ui.form.on("Transaction Paper Log", {
	refresh: function (frm) {
		frm.disable_save();

		if (frm.doc.paper_progress == __("Delivered to middle man")) {
			frappe.call({
				method: "frappe.client.get_value",
				args: {
					doctype: "Employee",
					fieldname: "user_id",
					filters: { name: frm.doc.middle_man },
				},
				callback: function (r) {
					if (r.message) {
						var middle_man_user_id = r.message.user_id;
						if (frappe.session.user == middle_man_user_id) {
							add_middle_man_received_action(frm);
						}
					}
				},
			});
		} else if (frm.doc.paper_progress == __("Received by middle man")) {
			frappe.call({
				method: "frappe.client.get_value",
				args: {
					doctype: "Employee",
					fieldname: "user_id",
					filters: { name: frm.doc.middle_man },
				},
				callback: function (r) {
					if (r.message) {
						var middle_man_user_id = r.message.user_id;
						if (frappe.session.user == middle_man_user_id) {
							add_middle_man_delivered_action(frm);
						}
					}
				},
			});
		} else if (frm.doc.paper_progress == __("Delivered to end employee")) {
			frappe.call({
				method: "frappe.client.get_value",
				args: {
					doctype: "Employee",
					fieldname: "user_id",
					filters: { name: frm.doc.end_employee },
				},
				callback: function (r) {
					if (r.message) {
						var end_employee_user_id = r.message.user_id;
						if (frappe.session.user == end_employee_user_id) {
							add_end_employee_received_action(frm);
						}
					}
				},
			});
		}
	},
});

function add_middle_man_received_action(frm) {
	cur_frm.page.add_action_item(__("Received"), function () {
		const attachments = frm.doc.attachments || [];
		let attachmentList = attachments
			.map(
				(attachment) =>
					`- ${attachment.attachment_label} (${attachment.number_of_papers} ${__(
						"papers"
					)})`
			)
			.join("<br>");

		let confirmationMessage = `
			<p>${__("Make sure you have received all the documents before accepting:")}</p>
			<p>${attachmentList}</p>
			<p>${__("Are you sure you have all these documents?")}</p>
		`;

		frappe.confirm(confirmationMessage, function () {
			frappe.db
				.set_value(
					"Transaction Paper Log",
					frm.docname,
					"paper_progress",
					__("Received by middle man")
				)
				.then(() => {
					location.reload();
				})
				.catch((error) => {
					frappe.msgprint({
						title: __("Error"),
						indicator: "red",
						message: __("An error occurred while updating the document."),
					});
					console.error(error);
				});
		});
	});
}

function add_middle_man_delivered_action(frm) {
	cur_frm.page.add_action_item(__("Delivered"), function () {
		frappe.prompt(
			[
				{
					fieldname: "with_proof",
					label: __("With Proof"),
					fieldtype: "Check",
				},
				{
					fieldname: "proof",
					label: __("Proof"),
					fieldtype: "Attach",
					depends_on: "eval:doc.with_proof == 1",
				},
			],
			function (values) {
				if (values.with_proof == 1 && !values.proof) {
					frappe.msgprint({
						title: __("Error"),
						indicator: "red",
						message: __("Please attach proof."),
					});
					return;
				} else if (values.with_proof == 1 && values.proof) {
					frappe.db.set_value("Transaction Paper Log", frm.docname, {
						paper_progress: __("Received by end employee"),
						ee_proof: values.proof,
					});
					frappe.db.get_value(
						"Employee",
						{ name: frm.doc.end_employee },
						"user_id",
						function (message) {
							frappe.call({
								method: "academia.transaction_management.doctype.transaction.transaction.change_is_received_in_action_recipients",
								args: {
									transaction_name: frm.doc.transaction_name,
									recipient_email: message.user_id,
								},
								callback: function (r) {
									if (r.message) {
										console.log(r.message);
									}
								},
								error: function (r) {
									frappe.show_alert({
										message: __("Error updating received status"),
										indicator: "red",
									});
								},
							});
						}
					);
					location.reload();
				} else {
					frappe.db.set_value(
						"Transaction Paper Log",
						frm.docname,
						"paper_progress",
						__("Delivered to end employee")
					);
					location.reload();
				}
			}
		);
	});
}

function add_end_employee_received_action(frm) {
	cur_frm.page.add_action_item(__("Received"), function () {
		const attachments = frm.doc.attachments || [];
		let attachmentList = attachments
			.map(
				(attachment) =>
					`- ${attachment.attachment_label} (${attachment.number_of_papers} ${__(
						"papers"
					)})`
			)
			.join("<br>");

		let confirmationMessage = `
			<p>${__("Make sure you have received all the documents before accepting:")}</p>
			<p>${attachmentList}</p>
			<p>${__("Are you sure you have all these documents?")}</p>
		`;

		frappe.confirm(confirmationMessage, function () {
			frappe.db
				.set_value(
					"Transaction Paper Log",
					frm.docname,
					"paper_progress",
					__("Received by end employee")
				)
				.then(() => {
					frappe.call({
						method: "academia.transaction_management.doctype.transaction.transaction.change_is_received_in_action_recipients",
						args: {
							transaction_name: frm.doc.transaction_name,
							recipient_email: frappe.session.user,
						},
						callback: function (r) {
							if (r.message) {
								console.log(r.message);
								location.reload();
							}
						},
						error: function (r) {
							frappe.show_alert({
								message: __("Error updating received status"),
								indicator: "red",
							});
						},
					});
				})
				.catch((error) => {
					frappe.msgprint({
						title: __("Error"),
						indicator: "red",
						message: __("An error occurred while updating the document."),
					});
					console.error(error);
				});
		});
	});
}
