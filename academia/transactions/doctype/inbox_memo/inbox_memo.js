// Copyright (c) 2024, SanU and contributors
// For license information, please see license.txt

function add_approve_action(frm) {
	cur_frm.page.add_action_item(__("Approve"), function () {
		frappe.prompt(
			[
				{
					label: "Details",
					fieldname: "details",
					fieldtype: "Text",
				},
			],
			function (values) {
				frappe.call({
					method: "academia.transactions.doctype.inbox_memo.inbox_memo.create_new_inbox_memo_action",
					args: {
						user_id: frappe.session.user,
						inbox_memo: frm.doc.name,
						type: "Approved",
						details: values.details || "",
						inbox_from: frm.doc.inbox_from || "",
					},
					callback: function (r) {
						if (r.message) {
							// console.log(r.message);
							if (r.message) {
								location.reload();
							}
							// frappe.db.set_value('Transaction', frm.docname, 'status', 'Approved');
						}
					},
				});
			},
			__("Enter Approval Details"),
			__("Submit")
		);
	});
}

function add_reject_action(frm) {
	cur_frm.page.add_action_item(__("Reject"), function () {
		frappe.prompt(
			[
				{
					label: "Details",
					fieldname: "details",
					fieldtype: "Text",
				},
			],
			function (values) {
				frappe.call({
					method: "academia.transactions.doctype.inbox_memo.inbox_memo.create_new_inbox_memo_action",
					args: {
						user_id: frappe.session.user,
						inbox_memo: frm.doc.name,
						type: "Rejected",
						details: values.details || "",
						inbox_from: frm.doc.inbox_from || "",
					},
					callback: function (r) {
						if (r.message) {
							location.reload();
							// frappe.db.set_value('Transaction', frm.docname, 'status', 'Rejected');
						}
					},
				});
			},
			__("Enter Rejection Details"),
			__("Submit")
		);
	});
}

frappe.ui.form.on("Inbox Memo", {
	before_submit: function (frm) {
		frm.set_value("current_action_maker", frm.doc.recipients[0].recipient_email);
	},

	refresh(frm) {
		if (frm.doc.current_action_maker == frappe.session.user) {
			add_approve_action(frm);
			add_reject_action(frm);
		}
	},

	onload: function (frm) {
		if (!frm.doc.start_from) {
			frappe.call({
				method: "frappe.client.get_value",
				args: {
					doctype: "Employee",
					filters: { user_id: frappe.session.user },
					fieldname: "name",
				},
				callback: function (response) {
					if (response.message) {
						frm.set_value("start_from", response.message.name);
					}
				},
			});
		}
	},

	get_recipients: function (frm) {
		let setters = {
			employee_name: null,
			department: null,
			designation: null,
		};
		if (frm.doc.type == "External") {
			setters.company = null;
			frappe.call({
				method: "academia.transaction_management.doctype.transaction.transaction.get_all_employees_except_start_with_company",
				args: {
					start_with_company: frm.doc.start_with_company,
				},
				callback: function (response) {
					mustInclude = response.message;
				},
			});
		} else if (frm.doc.type == "Internal") {
		}
		new frappe.ui.form.MultiSelectDialog({
			doctype: "Employee",
			target: frm,
			setters: setters,

			// add_filters_group: 1,
			// date_field: "transaction_date",
			get_query() {
				let filters = {
					docstatus: ["!=", 2],
				};
				if (frm.doc.type == "External") {
					filters.company = this.setters.company || "";
				}
				return {
					filters: filters,
				};
			},
			primary_action_label: __("Get Recipients"),

			action(selections) {
				if (selections.length > 1) {
					frappe.msgprint("You Can Only Select One Recipient");
					return;
				}
				// console.log(d.dialog.get_value("company"));
				// emptying Council members
				frm.set_value("recipients", []);
				// Hold employee names
				frappe.call({
					method: "frappe.client.get_list",
					args: {
						doctype: "Employee",
						filters: { name: ["in", selections] },
						fields: [
							"name",
							"employee_name",
							"designation",
							"department",
							"company",
							"user_id",
						],
					},
					callback: (response) => {
						var selectedEmployees = response.message;

						// frm.set_value('recipients', []);

						selectedEmployees.forEach((employee) => {
							frm.add_child("recipients", {
								recipient: employee.name, // Use document name instead of employee_name
								recipient_name: employee.employee_name,
								recipient_company: employee.company,
								recipient_department: employee.department,
								recipient_designation: employee.designation,
								recipient_email: employee.user_id,
							});
						});

						this.dialog.hide();

						frm.refresh_field("recipients");

						// // Hide the "Add" button for the recipients table if through_route is checked and there's a recipient
						// frm.get_field("recipients").grid.grid_buttons.find(".grid-add-row").toggle(!frm.doc.through_route || existingRecipients.length === 0);
					},
				});
			},
		});
	},

	clear_recipients: function (frm) {
		frm.clear_table("recipients");
		frm.refresh_field("recipients");
	},
});
