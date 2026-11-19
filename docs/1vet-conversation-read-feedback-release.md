# Appointment conversation read feedback

19 November 2026

Marking visible messages as read now confirms that the read status was saved. If the subsequent data refresh fails, the page says that the status was saved and asks the participant to refresh the unread count. A failed acknowledgement continues to show the existing read-status error.

Read boundaries remain limited to the visible page. The existing immediate-click lock prevents duplicate requests while acknowledgement is pending. Message sending and access checks are unchanged.

Validation: all 13 conversation component tests passed, including saved acknowledgement followed by refresh failure, repeated clicks, visible-page boundaries, draft recovery and account isolation. Type checking passed. No production database writes or backend migrations were needed.
