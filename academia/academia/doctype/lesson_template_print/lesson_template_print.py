# Copyright (c) 2024, SanU and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class LessonTemplatePrint(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		amended_from: DF.Link | None
		date_of_printing: DF.Date
		faculty: DF.Link
		instructor: DF.Link | None
		instructor_data: DF.JSON | None
		instructor_name: DF.Data | None
		schedule_template_version: DF.Link | None
	# end: auto-generated types
	pass
